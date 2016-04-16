
// Will be used to the save the loaded JSON and CSV data
var mapData = [];
var iedData = [];
var regionData = [];

// Variables for the visualization instances
var mapVis, timelineVis;
//var dsv = d3.dsv(";", "text/plain");

// Start application by loading the data
queue()
	.defer(d3.json, "data/ukraine.json")
	.defer(d3.csv, "data/ied_data.csv")
	.defer(d3.csv, "data/region_stats.csv")
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
		});
		regionData = regionDataCsv;
		console.log(iedData);
		
		// Copy topo json data
		mapData = mapTopoJson;
		console.log(mapData);
		
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
		console.log(regionData);

		// Create the visualizations
		createVis();
	})

function createVis() {
	// Instantiate visualization objects here
	mapVis = new Map("mapVis", iedData, mapData, regionData);
	timelineVis = new Timeline("timelineVis", iedData);
}

function brushed() {
	// Set new domain if brush (user selection) is not empty
	mapVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();

	// Update map
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
