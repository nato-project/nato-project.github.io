
/*
 * HeatMatrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

HeatMatrix = function(_parentElement, _data, _margin){
	this.parentElement = _parentElement;
	this.data = _data;
    this.displayData = []; // see data wrangling
    this.selectedRegion = "";

	this.initVis();
}


/*
 * Initialize heat matrix
 */

HeatMatrix.prototype.initVis = function(){
	var vis = this; // read about the this

	vis.barColor = "lightgrey";
	vis.matrixW = 550, vis.matrixH = 900, vis.cityBarW = 60, vis.timeBarH = 60;
	vis.timeBottom = 20; // Included in vis.height
	vis.cityLeft = 5; // Included in vis.width
	vis.maxRows = 60;
	vis.rowHeight = vis.matrixH/vis.maxRows;
	vis.colWidth = vis.matrixW/24;
	
	vis.margin = {top: 15, right: 25, bottom: 0, left: 130};

	vis.width = vis.matrixW + vis.cityBarW + vis.cityLeft;
	vis.height = vis.matrixH + vis.timeBarH + vis.timeBottom;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("x",0)
	    .attr("y",0)
	    .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
	    .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Initialize Heat Matrix
	vis.initHeatMatrix();
	
	// Initialize Time Bar Chart
	vis.initTimeBarChart();

	// Initialize City Bar Chart
	vis.initCityBarChart();

	// Initialize Legend
	vis.initLegend();
	
	// Wrangle data
	vis.wrangleData();
	
}

HeatMatrix.prototype.initHeatMatrix = function() {
    var vis = this; // read about the this
	
    // Create heat matrix group
    var hmsvg = vis.svg.append("g")
	    .attr("transform", "translate(0," + (vis.timeBarH + vis.timeBottom) + ")");

    // Create matrix data
	vis.matrixData = [];
	for(i=0;i<vis.maxRows;i++) {
		for(j=0;j<24;j++) {
			var cell = {};
			cell["i"] = i;
			cell["j"] = j;
			cell["value"] = 0;
			cell["city"] = "";
			cell["kia"] = 0;
			cell["wia"] = 0;
			vis.matrixData.push(cell);
		}
	}
    
    // Create color and type scales
    var values = [0, 0.01, 0.1, 0.2, 0.5, 0.8, 1.0];
    var colors = ["#eeeeee", "yellow", "gold", "orange", "orangered", "red", "darkred"];
    vis.colors = d3.scale.quantile().domain(values).range(colors);
	vis.typeScale = d3.scale.linear().range([0,1]);

	// Tool Tip
	vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
		var monthNames = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"];
		var theDate = monthNames[(d.j >11 ? d.j-12 : d.j)] + " 201" + (d.j >11 ? 5 : 4);
		var tipContent = "";
		tipContent += "<div class='tooltip-content text-center'>" + d.city + " in "+ theDate +"</div>";
		tipContent += "<div class='tooltip-content text-center'>IED Events: " + d.value + " / Killed: " + d.kia + " / Wounded: "+d.wia+"</div>";
		return tipContent;
	});

	// Create a rectangle for each city
	hmsvg.append("g").attr("id", "cityRowG").selectAll(".cityRow")
		.data(vis.matrixData)
		.enter()
		.append("rect")
		.attr("class", "cityRow");

	// Create city labels
	hmsvg.append("g").attr("id", "cityLabelG").selectAll(".cityLabel")
		.data(vis.data.slice(0, vis.maxRows))
		.enter()
		.append("text")
		.attr("class", "cityLabel")
		.style("text-anchor", "end");
}

HeatMatrix.prototype.initTimeBarChart = function() {
    var vis = this; // read about the this

    // Create time bar chart group
    var tbcsvg = vis.svg.append("g");
    
    // Create bar data
    vis.timeBarData = [];
	for(i=0;i<24;i++) {
		vis.timeBarData.push(0);
	}
	
    // Create time scale and axis
    vis.yScale = d3.scale.linear()
        .range([0, vis.timeBarH]);
	vis.time = d3.time.scale()
		.domain([new Date(2014, 0, 1), new Date(2015, 11, 31)])
		.range([0, vis.matrixW]);
	vis.timeAxis = d3.svg.axis()
		.scale(vis.time)
		.orient("bottom")
		.ticks(d3.time.months)
		.tickSize(3, 0)
		.tickFormat(d3.time.format("%b"));
	tbcsvg.append("g")
		.attr("class", "timeline-axis")
		.attr("transform", "translate(0," + (vis.timeBarH+2) + ")")
		.call(vis.timeAxis)

	// Add year titles
	tbcsvg.append("text")
		.attr("style","font-size:10;")
		.attr("x", -33)
		.attr("y", vis.timeBarH+10)
		.text("2014");
	tbcsvg.append("text")
		.attr("style","font-size:10;")
		.attr("x", vis.matrixW+5)
		.attr("y", vis.timeBarH+10)
		.text("2015");

    // Create a bar for each month
    tbcsvg.append("g").attr("id", "monthBarG").selectAll(".monthBar")
        .data(vis.timeBarData)
        .enter()
        .append("rect")
        .attr("class", "monthBar")
        .attr("x", function(d,i) {return i*vis.colWidth;})
        .attr("width", vis.colWidth-1)
        .style("fill", vis.barColor);
    
    // Create bar labels
    tbcsvg.append("g").attr("id", "monthBarLabelG").selectAll(".monthBarLabel")
	    .data(vis.timeBarData)
	    .enter()
	    .append("text")
	    .attr("class", "monthBarLabel")
	    .attr("x", function(d,i) {return (i+1)*vis.colWidth-5;})
   	    .style("font-size", "10px")
   	    .style("text-anchor", "end");

    // Custom bar axis labels
    /*tbcsvg.append("g").attr("id", "monthLabelG").selectAll(".monthLabel")
	    .data(vis.timeBarData)
	    .enter()
	    .append("text")
	    .attr("class", "monthLabel")
	    .attr("x", function(d,i) {return (i+1)*vis.colWidth;})
	    .attr("y", function(d) {return vis.timeBarH+11;})
	    .text(function(d,i) {
	    	var year = i>11 ? "15" : "14";
	    	var month = i>11 ? (i-11): i+1;
	    	return month + "/" + year;
	    })
	    .style("font-size", "10px")
	    .style("text-anchor", "end");*/
}

HeatMatrix.prototype.initCityBarChart = function(){
    var vis = this; // read about the this

    // Create heat matrix group
    var cbcsvg = vis.svg.append("g")
	    .attr("transform", "translate(" + (vis.matrixW+vis.cityLeft)
	    		+  "," + (vis.timeBarH + vis.timeBottom) + ")");

    // Create bar data
    vis.cityBarData = [];
	for(i=0;i<vis.maxRows;i++) {
		vis.cityBarData.push(0);
	}

    // Create scales
    vis.xScale = d3.scale.linear()
        .range([0, vis.cityBarW]);

    // Create a bar for each city
    cbcsvg.append("g").attr("id", "cityBarG").selectAll(".cityBar")
        .data(vis.cityBarData)
        .enter()
        .append("rect")
        .attr("class", "cityBar")
        .attr("x", 0)
        .attr("y", function(d,i) {return i*vis.rowHeight;})
        .attr("height", vis.rowHeight-1)
        .style("fill", vis.barColor);

	// Create city bar labels
    cbcsvg.append("g").attr("id", "cityBarLabelG").selectAll(".cityBarLabel")
		.data(vis.data.slice(0, vis.maxRows))
		.enter()
		.append("text")
		.attr("class", "cityBarLabel")
	    .attr("y", function(d,i) {return (i+0.5)*vis.rowHeight + 5;})
	    .style("font-size", "10px");
}

HeatMatrix.prototype.initLegend = function(){
    var vis = this; // read about the this

    var transH = 15;
    var transV = 20;
    var side = ((vis.margin.left-transH)/(1+vis.colors.range().length))-4;

    // Create legend
    var legend = vis.svg.append("g")
	    .attr("transform", "translate("+(transH-vis.margin.left)+"," +transV+ ")")
    	.attr("id", "heatMatrixLegend");

    // Legend data
    var legendColors = vis.colors.range();

	// Legend title
	legend.append("text")
	    .attr("id","heatLegendTitle")
	    .attr("transform", "translate(" +(transH-5) + ",10)");

	// Add color squares
	legend.append("g").selectAll("rect")
	    .data(legendColors)
	    .enter()
	    .append("rect")
	    .attr("class", "heatLegendColor")
	    .attr("fill", function (d) {return d;})
	    .attr("height", side)
	    .attr("width", side)
	    .attr("transform", function(d, i) {
	        return "translate(" + (i*(side+3) + transH) +"," + 15 + ")";
	    });

	var legendValues = [0];
	vis.colors.range().forEach(function(d,i) {
	    legendValues.push(0);
	});	
	
	// Add values
	legend.append("g").selectAll("text")
	    .data(legendValues)
	    .enter()
	    .append("text")
	    .attr("class", "heatLegendValue")
	    .attr("text-anchor","end")
	    .attr("transform", function(d, i) {
	        return "translate(" + (i*(side+3) + transH) +"," + (25+side)+")";
	    })
   	    .style("font-size", "10px");
}

HeatMatrix.prototype.wrangleData = function() {
    var vis = this; // read about the this

    // Filter cities
    var cityData;
    if (vis.selectedRegion != "") {
    	cityData = vis.data.filter(function (d) {return (d.RegionID == vis.selectedRegion);});
    } else {
    	cityData = vis.data;
    }

    // Sort cities
	var sortedCityData = cityData.sort(function(a,b) {return b.IEDeventTotal- a.IEDeventTotal;});

	// Keep top cities
	vis.displayData = sortedCityData.slice(0, vis.maxRows);
    
	// Update the visualization
   	vis.updateVis();

}

HeatMatrix.prototype.updateVis = function() {
    var vis = this; // read about the this
	
    // Update Heat Matrix
	vis.updateHeatMatrix();
	
	// Update Time Bar Chart
	vis.updateTimeBarChart();

	// Update City Bar Chart
	vis.updateCityBarChart();

	// Update Legend
	vis.updateLegend();

}

HeatMatrix.prototype.updateHeatMatrix = function() {
    var vis = this; // read about the this

    // Create matrix data
	vis.matrixData = [];
	vis.displayData.forEach(function(d,i) {
		for(j=0;j<24;j++) {
			var cell = {};
			cell["i"] = i;
			cell["j"] = j;
			cell["value"] = d.IEDevents[j];
			cell["city"] = d.ID;
			cell["kia"] = d.KIA[j];
			cell["wia"] = d.WIA[j];
			vis.matrixData.push(cell);
		}
	})

	// Update type scale
	var maxValue = d3.max(vis.matrixData, function(d) {return d.value;});
	vis.typeScale.domain([0,maxValue]);
	
	// Enter Update Exit city rectangles
	var selection = d3.select("#cityRowG").selectAll(".cityRow").data(vis.matrixData);

	selection.enter()
		.append("rect")
		.attr("class", "cityRow");

	selection
		.attr("x", function(d) {return d.j*vis.colWidth;})
		.attr("y", function(d) {return d.i*vis.rowHeight;})
		.attr("width", vis.colWidth-1)
		.attr("height", vis.rowHeight-1)
		.style("fill", function(d) {
			return vis.colors(vis.typeScale(d.value));
		})
		.on('mouseover', vis.tip.show)
		.on('mouseout', vis.tip.hide)
		.call(vis.tip);
	
	selection.exit().remove();

	// Enter Update Exit city labels
	selection = d3.select("#cityLabelG").selectAll(".cityLabel").data(vis.displayData);
	
	selection.enter()
		.append("text")
		.attr("class", "cityLabel")
		.style("text-anchor", "end");

	selection
		.attr("x", -5)
		.attr("y", function(d, i) {return (i+0.5)*vis.rowHeight+4;})
		.text(function(d){ return d.ID;});
	
	selection.exit().remove();
}

HeatMatrix.prototype.updateTimeBarChart = function(){
    var vis = this; // read about the this

    // Create bar data
    vis.timeBarData = [];
    vis.displayData.forEach(function(d,i) {
        if (i == 0) {
            for (j=0; j<24; j++) {
                vis.timeBarData[j] = d.IEDevents[j];
            }
        } else {
            for (j=0; j<24; j++) {
                vis.timeBarData[j] += d.IEDevents[j];
            }
        }
    })

    // Update scale
    var maxValue = d3.max(vis.timeBarData);
    vis.yScale.domain([0, maxValue])

   	// Enter Update Exit month bars
	var selection = d3.select("#monthBarG").selectAll(".monthBar").data(vis.timeBarData);

    selection.enter()
        .append("rect")
        .attr("class", "monthBar")
        .attr("x", function(d,i) {return i*vis.colWidth-3;})
        .attr("width", vis.colWidth-1)
        .style("fill", vis.barColor);
    
    selection.attr("y", function(d) {return vis.timeBarH-vis.yScale(d);})
    	.attr("height", function(d) {return vis.yScale(d);})
    
   	selection.exit().remove();

   	// Enter Update Exit month bar labels
	selection = d3.select("#monthBarLabelG").selectAll(".monthBarLabel").data(vis.timeBarData);

    selection.enter()
	    .append("text")
	    .attr("class", "monthBarLabel")
	    .attr("x", function(d,i) {return (i+1)*vis.colWidth-6;})
   	    .style("font-size", "10px")
   	    .style("text-anchor", "end");
    
    selection.text(function(d) {return d;})
    	.attr("y", function(d) {return vis.timeBarH-vis.yScale(d)-3;});
    
   	selection.exit().remove();
}

HeatMatrix.prototype.updateCityBarChart = function(){
    var vis = this; // read about the this

    // Create bar data
    vis.cityBarData = [];
    vis.displayData.forEach(function(d) {
        vis.cityBarData.push(d3.sum(d.IEDevents));
    })

    // Update scale
    var maxValue = d3.max(vis.cityBarData);
    vis.xScale.domain([0, maxValue])

   	// Enter Update Exit city bars
	selection = d3.select("#cityBarG").selectAll(".cityBar").data(vis.cityBarData);

    selection.enter()
        .append("rect")
        .attr("class", "cityBar")
        .attr("x", 0)
        .attr("y", function(d,i) {return i*vis.rowHeight;})
        .attr("height", vis.rowHeight-1)
        .style("fill", vis.barColor);
    
    selection.attr("width", function(d) {return vis.xScale(d);})

   	selection.exit().remove();

   	// Enter Update Exit city bars labels
	selection = d3.select("#cityBarLabelG").selectAll(".cityBarLabel").data(vis.cityBarData);

	selection.enter()
	    .append("text")
	    .attr("class", "cityBarLabel")
	    .attr("y", function(d,i) {return (i+0.5)*vis.rowHeight + 5;})
	    .style("font-size", "10px");

	selection.attr("x", function(d) {return 3+vis.xScale(d);})
		.text(function(d) {return d;});
	
	selection.exit().remove();
}


HeatMatrix.prototype.updateLegend = function() {
    var vis = this; // read about the this

    if (vis.displayData.length == 0) {
	    vis.svg.select("#heatLegendTitle").text("No IED Events");
	    d3.selectAll(".heatLegendValue").attr("visibility","hidden");
	    d3.selectAll(".heatLegendColor").attr("visibility","hidden");
    }
    else {
    	// Show
	    d3.selectAll(".heatLegendValue").attr("visibility","visible");
	    d3.selectAll(".heatLegendColor").attr("visibility","visible");
    
	    // Update legend
	    vis.svg.select("#heatLegendTitle").text("IED Events");
	    var legendValues = [0];
	    vis.colors.range().forEach(function(d,i) {
	        legendValues.push(Math.round(vis.typeScale.invert(vis.colors.invertExtent(d)[1])));
	    });
	    var entries = vis.svg.selectAll(".heatLegendValue")
	        .data(legendValues)
	        .text(function (d) {return d;});
	}
}