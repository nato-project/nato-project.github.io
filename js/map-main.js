
// Will be used to the save the loaded JSON and CSV data
var mapData = [];
var iedData = [];
var regionData = [];
var cityData = [];

// Variables for the visualization instances
var mapVis, timelineVis,countsVis;
//var dsv = d3.dsv(";", "text/plain");

// Start application by loading the data
queue()
	.defer(d3.json, "data/ukraine.json")
	.defer(d3.csv, "data/ied_data.csv")
	.defer(d3.csv, "data/region_stats_detail.csv")
	.await(function(error, mapTopoJson, iedDataCsv, regionDataCsv) {

		// Date parser to convert strings to date objects
		var parseDate = d3.time.format("%m/%d/%Y").parse;

		// Convert numeric values to 'numbers'
		iedDataCsv.forEach(function(d) {
			d.kia = +d.kia;
			d.wia = +d.wia;
			d.id = +d.id;
			d.lat = parseFloat(d.lat);
			d.lng = parseFloat(d.lng);
			d.date = parseDate(d.date);
		});
		iedData = iedDataCsv;
		regionDataCsv.forEach(function(d) {
			d.area = +d.area;
			d.population = +d.population;
			d.pop_density = parseFloat(d.pop_density);
			d.pop_russians = +d.pop_russians;
			d.pop_ukranians = +d.pop_ukranians;
			d.pct_russian_speakers = parseFloat(d.pct_russian_speakers);
		});
		regionData = regionDataCsv;
		regionDataCsv.forEach(function(d) {
			d.IEDevents = 0;
			d.KIA = 0;
			d.WIA = 0;
		});
		
		// Arrange data by cities
		arrangeDataByCity();
		
		// Copy topo json data
		mapData = mapTopoJson;
		
		// Add IED events to region data for region coloring
		var idMap = {};
		iedData.forEach(function(d) {
			var regionId = d.region_id;
			if (regionId)
			
			if (idMap[regionId] == null) {
				// Get region index in the table
				var regionIndex = regionData.findIndex(function(d) {return d.region_id == regionId;});

				if (regionIndex != -1) {
					// Insert IED data
					regionData[regionIndex].IEDevents = 1;
					regionData[regionIndex].KIA = d.kia;
					regionData[regionIndex].WIA = d.wia;
					idMap[regionId] = regionIndex;
				}
				else {
					// Create the region data
					var regionObj = {};
					regionObj.region_id = regionId;
					regionObj.IEDevents = 1;
					regionObj.KIA = d.kia;
					regionObj.WIA = d.wia;
					idMap[regionId] = regionData.length;
					regionData.push(regionObj);
				}
			}
			else {
				// Increase IED data
				regionData[idMap[regionId]].IEDevents += 1;
				regionData[idMap[regionId]].KIA += d.kia;
				regionData[idMap[regionId]].WIA += d.wia;
			}
		});

		// Create the visualizations
		createVis();
	})

function createVis() {
	// Instantiate visualization objects here
	mapVis = new Map("mapVis", iedData, mapData, regionData);
	timelineVis = new Timeline("timelineVis", iedData);
	heatMatrixVis = new HeatMatrix("heatMatrixVis", cityData);
	countsVis = new Counts("countsVis", iedData,900,300);
}

function brushed() {
	// Set new domain if brush (user selection) is not empty
	mapVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();

	// Update map
	mapVis.wrangleData();

	// Count Vis
	countsVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();
	countsVis.wrangleData();
}

function regionClick(regionId) {
	if (mapVis.selectedRegion == regionId) {
		mapVis.selectedRegion = "";
		heatMatrixVis.selectedRegion = "";
	}
	else {
		mapVis.selectedRegion = regionId;
		heatMatrixVis.selectedRegion = regionId;
	}
	// Update
	mapVis.updateVis();
	heatMatrixVis.wrangleData();
}

function circleLabelClick(circleType) {
	if (mapVis.circleFilter == circleType) {
		mapVis.circleFilter = "";
	}
	else {
		mapVis.circleFilter = circleType;
	}
	// Update
	mapVis.wrangleData();
}

function regionColorSelect() {

	var selectBox = document.getElementById("regionColorSelect");
	if (mapVis.dataType != selectBox.options[selectBox.selectedIndex].value) {
		mapVis.dataType = selectBox.options[selectBox.selectedIndex].value;
		mapVis.dataLabel = selectBox.options[selectBox.selectedIndex].text;
		mapVis.updateVis();
	}
}

function circleColorSelect() {

	var selectBox = document.getElementById("circleColorSelect");
	if (mapVis.circleType != selectBox.options[selectBox.selectedIndex].value) {
		mapVis.circleType = selectBox.options[selectBox.selectedIndex].value;
		mapVis.circleLabel = selectBox.options[selectBox.selectedIndex].text;
		mapVis.circleFilter = "";
		mapVis.wrangleData();
	}
}

function arrangeDataByCity() {

	var idMap = {};
	iedData.forEach(function(d) {
		var cityName = d.city.trim(); // Remove whitespaces in some names
		if (cityName == "NULL") {
			// Do not include unidentified cities
		}
		else if (idMap[cityName] == null) {
			var cityObj = {};
			cityObj.RegionID = d.region_id;
			cityObj.ID = cityName;
			cityObj.IEDeventTotal = 1;
			var monthIndex = getMonthIndex(d.date);
			cityObj.IEDevents = new Array(24).fill(0);
			cityObj.IEDevents[monthIndex] += 1;
			cityObj.KIA = new Array(24).fill(0);
			cityObj.KIA[monthIndex] = d.kia;
			cityObj.WIA = new Array(24).fill(0);
			cityObj.WIA[monthIndex] = d.wia;
			idMap[cityName] = cityData.length;
			cityData.push(cityObj);
		}
		else {
			cityData[idMap[cityName]].IEDeventTotal += 1;
			var monthIndex = getMonthIndex(d.date);
			cityData[idMap[cityName]].IEDevents[monthIndex] += 1;
			cityData[idMap[cityName]].KIA[monthIndex] += d.wia;
			cityData[idMap[cityName]].WIA[monthIndex] += d.kia;
		}
	});
	delete idMap; // Next op makes it out of synch

}

function getMonthIndex(date) {
	// 01-11 for 2014, 12-23 for 2015
	var monthIndex = date.getMonth();
	if (date.getYear() == 115) monthIndex += 12;
	return monthIndex;
}

function showMapKiev() {

	// Set new brush domain
	var newFilter = [new Date(2014,0,1), new Date(2015,11,30)];
	timelineVis.brush.extent(newFilter);
	timelineVis.brush(d3.select(".brush").transition());
	timelineVis.brush.event(d3.select(".brush").transition().delay(1000))
	mapVis.filter = newFilter;

	// Count Vis
	countsVis.filter = newFilter;
	countsVis.wrangleData();

	// Select Donestk region
	mapVis.selectedRegion = "kiev";
	heatMatrixVis.selectedRegion = "kiev";

	// Color regions by number of events
	var selectBox = document.getElementById("regionColorSelect");
	selectBox.selectedIndex = 2;
	mapVis.dataType = selectBox.options[selectBox.selectedIndex].value;
	mapVis.dataLabel = selectBox.options[selectBox.selectedIndex].text;

	// Color circles by effect
	var selectBox2 = document.getElementById("circleColorSelect");
	selectBox2.selectedIndex = 0;
	mapVis.circleType = selectBox2.options[selectBox2.selectedIndex].value;
	mapVis.circleLabel = selectBox2.options[selectBox2.selectedIndex].text;

	// Update
	mapVis.wrangleData();
	heatMatrixVis.wrangleData();

}

function showMapDonestk() {

	// Set new brush domain
	var newFilter = [new Date(2015,8,1), new Date(2015,11,30)];
	timelineVis.brush.extent(newFilter);
	timelineVis.brush(d3.select(".brush").transition());
	timelineVis.brush.event(d3.select(".brush").transition().delay(1000))
	mapVis.filter = newFilter;

	// Count Vis
	countsVis.filter = newFilter;
	countsVis.wrangleData();

	// Select Donestk region
	mapVis.selectedRegion = "dn";
	heatMatrixVis.selectedRegion = "dn";

	// Color regions by number of events
	var selectBox = document.getElementById("regionColorSelect");
	selectBox.selectedIndex = 3;
	mapVis.dataType = selectBox.options[selectBox.selectedIndex].value;
	mapVis.dataLabel = selectBox.options[selectBox.selectedIndex].text;

	// Color circles by effect
	var selectBox2 = document.getElementById("circleColorSelect");
	selectBox2.selectedIndex = 1;
	mapVis.circleType = selectBox2.options[selectBox2.selectedIndex].value;
	mapVis.circleLabel = selectBox2.options[selectBox2.selectedIndex].text;

	// Update
	mapVis.wrangleData();
	heatMatrixVis.wrangleData();

}