
/*
 * HeatMatrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

HeatMatrix = function(_parentElement, _data, _margin){
	this.parentElement = _parentElement;
	this.data = _data;

	this.initVis();
}


/*
 * Initialize heat matrix
 */

HeatMatrix.prototype.initVis = function(){
	var vis = this; // read about the this

	vis.matrixW = 600, vis.matrixH = 600, vis.cityBarW = 80, vis.timeBarH = 80;
	vis.timeBottom = 15; // Included in vis.height
	vis.cityLeft = 5; // Included in vis.width
	
	vis.margin = {top: 15, right: 25, bottom: 0, left: 150};

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
}

HeatMatrix.prototype.initHeatMatrix = function() {
    var vis = this; // read about the this
	
    // Create heat matrix group
    var hmsvg = vis.svg.append("g")
	    .attr("transform", "translate(0," + (vis.timeBarH + vis.timeBottom) + ")");
    
    // Create matrix data
	vis.matrixData = [];
	vis.data.forEach(function(d,i) {
		for(j=0;j<24;j++) {
			var cell = {};
			cell["i"] = i;
			cell["j"] = j;
			cell["value"] = d.IEDevents[j];
			vis.matrixData.push(cell);
		}
	})

	// Set type and color scales
	var maxValue = d3.max(vis.matrixData, function(d) {return d.value;});
    var values = [0, 0.05, 0.1, 0.2, 0.5, 0.8, 1.0];
	var colors = ["#eeeeee", "yellow", "gold", "orange", "orangered", "red", "darkred"];
    vis.colors = d3.scale.quantile().domain(values).range(colors);
    vis.typeScale = d3.scale.linear().domain([0,maxValue]).range([0,1]);
    
	// Create a rectangle for each city
	var rowHeight = vis.matrixH/vis.data.length;
	var colWidth = vis.matrixW/24;
	
	hmsvg.append("g").selectAll(".cityRow")
		.data(vis.matrixData)
		.enter()
		.append("rect")
		.attr("class", "cityRow")
		.attr("x", function(d) {return d.j*colWidth;})
		.attr("y", function(d) {return d.i*rowHeight;})
		.attr("width", colWidth-1)
		.attr("height", rowHeight-1)
		.style("fill", function(d) {
			return vis.colors(vis.typeScale(d.value));
		});

	// Create city labels
	hmsvg.append("g").selectAll(".cityLabel")
		.data(vis.data)
		.enter()
		.append("text")
		.attr("class", "cityLabel")
		.attr("x", -5)
		.attr("y", function(d, i) {return (i+0.5)*rowHeight+4;})
		.text(function(d){ return d.ID;})
		.style("text-anchor", "end");
}

HeatMatrix.prototype.initTimeBarChart = function() {
    var vis = this; // read about the this

    // Create time bar chart group
    var tbcsvg = vis.svg.append("g");
    
    // Create bar data
    vis.barData = [];
    vis.data.forEach(function(d,i) {
        if (i == 0) vis.barData = d.IEDevents;
        else {
            for (j=0; j<24; j++) {
                vis.barData[j] += d.IEDevents[j];
            }
        }
    })

    // Create scales
    var maxValue = d3.max(vis.barData);
    vis.yScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([0, vis.timeBarH]);

    // Create a bar for each month
    var colWidth = vis.matrixW/24;
    tbcsvg.append("g").selectAll(".monthBar")
        .data(vis.barData)
        .enter()
        .append("rect")
        .attr("class", "monthBar")
        .attr("x", function(d,i) {return i*colWidth;})
        .attr("y", function(d) {return vis.timeBarH-vis.yScale(d);})
        .attr("width", colWidth-1)
        .attr("height", function(d) {return vis.yScale(d);})
        .style("fill", "orange");
    
    // Create bar labels
    tbcsvg.append("g").selectAll(".monthBarLabel")
	    .data(vis.barData)
	    .enter()
	    .append("text")
	    .attr("class", "monthBarLabel")
	    .attr("x", function(d,i) {return (i+0.5)*colWidth-8;})
	    .attr("y", function(d) {return vis.timeBarH-vis.yScale(d)-3;})
	    .text(function(d) {return d;})
   	    .style("font-size", "10px");

    // Custom bar axis labels
    tbcsvg.append("g").selectAll(".monthLabel")
	    .data(vis.barData)
	    .enter()
	    .append("text")
	    .attr("class", "monthLabel")
	    .attr("x", function(d,i) {return (i)*colWidth+5;})
	    .attr("y", function(d) {return vis.timeBarH+11;})
	    .text(function(d,i) {
	    	var year = i>11 ? "15" : "14";
	    	var month = i>11 ? (i-11): i+1;
	    	return month + "/" + year;
	    })
	    .style("font-size", "10px");
}

HeatMatrix.prototype.initCityBarChart = function(){
    var vis = this; // read about the this

    // Create heat matrix group
    var cbcsvg = vis.svg.append("g")
	    .attr("transform", "translate(" + (vis.matrixW+vis.cityLeft)
	    		+  "," + (vis.timeBarH + vis.timeBottom) + ")");

    // Create bar data
    vis.barData = [];
    vis.data.forEach(function(d) {
        vis.barData.push(d3.sum(d.IEDevents));
    })

    // Create scales
    var maxValue = d3.max(vis.barData);
    vis.xScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([0, vis.cityBarW]);

    // Create a bar for each month
    var rowHeight = vis.matrixH/vis.data.length;
    cbcsvg.append("g").selectAll(".cityBar")
        .data(vis.barData)
        .enter()
        .append("rect")
        .attr("class", "cityBar")
        .attr("x", 0)
        .attr("y", function(d,i) {return i*rowHeight;})
        .attr("width", function(d) {return vis.xScale(d);})
        .attr("height", rowHeight-1)
        .style("fill", "orange");

    // Create bar labels
    cbcsvg.append("g").selectAll(".cityBarLabel")
	    .data(vis.barData)
	    .enter()
	    .append("text")
	    .attr("class", "cityBarLabel")
	    .attr("x", function(d) {return 3+vis.xScale(d);})
	    .attr("y", function(d,i) {return (i+0.5)*rowHeight + 5;})
	    .text(function(d) {return d;})
	    .style("font-size", "10px");
}

HeatMatrix.prototype.initLegend = function(){
    var vis = this; // read about the this

    var transH = 10;
    var transV = 40;
    var side = ((vis.margin.left-transH)/(1+vis.colors.range().length))-4;

    // Create legend
    var legend = vis.svg.append("g")
	    .attr("transform", "translate("+(transH-vis.margin.left)+"," +transV+ ")")
    	.attr("id", "heatMatrixLegend");

    // Legend data
    var legendColors = vis.colors.range();
    var legendValues = [0];
    vis.colors.range().forEach(function(d,i) {
        legendValues.push(Math.round(vis.typeScale.invert(vis.colors.invertExtent(d)[1])));
    });
 
	// Legend title
	legend.append("text")
	    .attr("id","heatLegendTitle")
	    .attr("transform", "translate(5,10)");
	
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


