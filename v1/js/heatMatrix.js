
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

	vis.margin = {top: 5, right: 5, bottom: 5, left: 150};

	vis.width = matrixW;
	vis.height = matrixH;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

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

	// Create color scale
	var maxValue = d3.max(vis.matrixData, function(d) {return d.value;});
	//vis.colors = d3.scale.quantize().domain([0,maxValue]).range(colorbrewer.Greys[5]);

	// Create a rectangle for each city
	var rowHeight = vis.height/vis.data.length;
	var colWidth = vis.width/24;
	vis.svg.append("g").selectAll(".cityRow")
		.data(vis.matrixData)
		.enter()
		.append("rect")
		.attr("class", "cityRow")
		.attr("x", function(d) {return d.j*colWidth;})
		.attr("y", function(d) {return d.i*rowHeight;})
		.attr("width", colWidth-1)
		.attr("height", rowHeight-1)
		.style("fill", function(d) {
			if (d.value == 0) return "#eeeeee";
			if (d.value == 1) return "yellow";
			if (d.value > 1 && d.value <= 5) return "gold";
			if (d.value > 5 && d.value <= 10) return "orange";
			if (d.value > 10 && d.value <= 20) return "orangered";
			if (d.value > 20 && d.value <= 30) return "red";
			if (d.value > 30 ) return "darkred";
			//return vis.colors(d.value);
		});

	// Create city labels
	vis.svg.append("g").selectAll(".cityLabel")
		.data(vis.data)
		.enter()
		.append("text")
		.attr("class", "cityLabel")
		.attr("x", -5)
		.attr("y", function(d, i) {return (i+0.5)*rowHeight+4;})
		.text(function(d){ return d.ID;})
		.style("text-anchor", "end");
}

