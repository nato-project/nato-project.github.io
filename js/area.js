/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _iedData			-- the ied data
 */

AreaChart = function(_parentElement, _iedData, _mapData, _regionData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;
    this.displayData = []; // see data wrangling
    this.filter = [];
    this.selectedType = "";

    this.dateFormat = d3.time.format("%b %d %Y");
    this.initVis();
}

/*
 * Initialize area chart with brushing component
 */
AreaChart.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 10, right: 40, bottom: 20, left: 35};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
    
    
    // Create area chart group
    var areaG = vis.svg;
    
    // Create area chart data
    vis.arrangeDataByType();
    console.log(vis.areaData);

    // Create time scale and axis
    vis.yScale = d3.scale.linear()
        .range([0, vis.height]);
	vis.yAxis = d3.svg.axis()
		.scale(vis.yScale)
		.orient("right");
	areaG.append("g")
		.attr("class", " timeline-axis")
		.attr("transform", "translate("+ (vis.width+2)+ ",0)")
		.call(vis.yAxis);
	vis.time = d3.time.scale()
		.domain([new Date(2014, 0, 1), new Date(2015, 11, 31)])
		.range([0, vis.width]);
	vis.timeAxis = d3.svg.axis()
		.scale(vis.time)
		.orient("bottom")
		.ticks(d3.time.months)
		.tickSize(3, 0)
		.tickFormat(d3.time.format("%b"));
	areaG.append("g")
		.attr("class", "timeline-axis")
		.attr("transform", "translate(0,"+ (vis.height+2)+ ")")
		.call(vis.timeAxis);

	// Add year titles
	areaG.append("text")
		.attr("style","font-size:10;")
		.attr("x", -33)
		.attr("y", vis.height+15)
		.text("2014");
	areaG.append("text")
		.attr("style","font-size:10;")
		.attr("x", vis.width+3)
		.attr("y", vis.height+15)
		.text("2015");

	// Chart title
	areaG.append("text")
	.attr("style","font-size:20;")
	.attr("x", 0)
	.attr("y", 7)
	.text("IED Incidents by Type");

	
	// Initialize stack layout function
	// with the 'values' accessor due to the multi-dimensional array
	var stack = d3.layout.stack()
		.values(function(d) { return d.values; });
	
	// Call layout function on the dataset
	vis.stackedData = stack(vis.layers);

	// Stacked area layout
	vis.area = d3.svg.area()
		.interpolate("cardinal")
		.x(function(d) { 
			var year = (d.x>11) ? 2015 : 2014;
			var month = (d.x>11) ? x-12 : x;
			return vis.time(new Date(year, month, 1)); })
		.y0(function(d) { return vis.yScale(d.y0); })
		.y1(function(d) { return vis.yScale(d.y0 + d.y); });

    // Wrangle and update
    vis.wrangleData();
}

AreaChart.prototype.wrangleData = function() {
    var vis = this; // read about the this

    // Update the visualization
    vis.updateVis();

}

AreaChart.prototype.updateVis = function() {
    var vis = this; // read about the this

    // Update scale
	var maxValue = d3.max(vis.areaData, function(d) {return d.IEDevents;});
    vis.yScale.domain([0, maxValue]);

    
}

AreaChart.prototype.arrangeDataByType = function() {
    var vis = this; // read about the this

    var iedTypes = ["CACHE/FOUND","CRIME","CWIED","HOAX/FALSE","PROJECTED","RCIED","S-PBIED","TIME DELAY","UNKNOWN","VBIED","VOIED"];
    vis.areaData = {};
	iedTypes.forEach(function(d) {
		var obj = {};
		obj.name = d;
		obj.IEDeventTotal = 0;
		obj.IEDevents = new Array(24).fill(0);
		obj.KIA = new Array(24).fill(0);
		obj.WIA = new Array(24).fill(0);
		vis.areaData[d] = obj;
	});
	
	vis.iedData.forEach(function(d) {
		// 01-11 for 2014, 12-23 for 2015
		var monthIndex = d.date.getMonth();
		if (d.date.getYear() == 115) monthIndex += 12;

		vis.areaData[d.type].IEDeventTotal += 1;
		vis.areaData[d.type].IEDevents[monthIndex] += 1;
		vis.areaData[d.type].KIA[monthIndex] += d.wia;
		vis.areaData[d.type].WIA[monthIndex] += d.kia;
	});
	
	vis.layers = [];
	iedTypes.forEach(function(type) {
		var obj = {};
		obj.name = type;
		obj.values = [];
		for(var i=0; i<24; i++) {
			var pt = {"x":i,"y": vis.areaData[type].IEDevents[i]};
			obj.values.push(pt);
		}
		vis.layers.push(obj);
	});
}

