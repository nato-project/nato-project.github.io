
/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

Timeline = function(_parentElement, _data,_width){
	this.parentElement = _parentElement;
	this.data = _data;

	if(_width){
		this.width = _width;
	}else{
		this.width = 900;
	}


	this.initVis();
}


/*
 * Initialize timeline chart with brushing component
 */

Timeline.prototype.initVis = function(){
	var vis = this; // read about the this

	vis.margin = {top: 10, right: 10, bottom: 20, left: 10};

	vis.width = vis.width - vis.margin.left - vis.margin.right,
	vis.height = 90 - vis.margin.top - vis.margin.bottom;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
		.attr("x",0)
		.attr("y",0)
		.attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
	    .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Scales and axes
	vis.x = d3.time.scale()
		.domain([new Date(2014, 0, 1), new Date(2015, 11, 31)])
		.range([0, vis.width]);

	vis.xAxis = d3.svg.axis()
		.scale(vis.x)
		.orient("bottom")
		.ticks(d3.time.months)
		.tickSize(16, 0)
		.tickFormat(d3.time.format("%b"));

	// Add x Axes
	vis.svg.append("g")
		.attr("class", "timeline-axis")
		.attr("transform", "translate(0," + vis.height + ")")
		.call(vis.xAxis)
		.selectAll(".tick text")
		.style("text-anchor", "start")
		.attr("x", 6)
		.attr("y", 6);

	// Create svg elements
	//vis.svg.append("g")
	//	.selectAll("circle")
	//	.data(vis.data)
	//	.enter().append("circle")
	//	.attr("cx", function(d) {
	//		if (d.date) return vis.x(d.date);})
	//	.attr("cy", function(d) {return vis.y(d.kia + d.wia);})
	//	.attr("r", 5)
	//	.attr("fill",function(d) {
	//		if (d.kia > 0) return "red";
	//		if (d.wia > 0) return "orange";
	//		return "grey";
	//	});
    //

	// Prepare Data for Timeline
	vis.killed_wounded = [];
	vis.data.forEach(function (d, i) {
		var index =0;
		for(var i=0;i< d.kia;i++) {
			vis.killed_wounded.push({date: d.date,kia:1,wia:0,index:index++});
		}
		for(var i=0;i< d.wia;i++) {
			vis.killed_wounded.push({date: d.date,kia:0,wia:1,index:index++});
		}
	});

	// Create svg elements
	vis.barGroup = vis.svg.append("g");
	vis.circleGroup = vis.svg.append("g");

	vis.bar = vis.barGroup.selectAll("g")
		.data(vis.data)
		.enter()
		.append("g")
		.attr("transform", function(d, i) { return "translate(" + (vis.x(d.date)) + ",0)"; });

	vis.circle = vis.circleGroup.selectAll("g")
		.data(vis.killed_wounded)
		.enter()
		.append("g")
		.attr("transform", function(d, i) { return "translate(" + (vis.x(d.date)) + ",0)"; });

	// Incidents
	vis.bar.append("rect")
		.attr("class", "timeline-bar")
		.attr("y", function(d) { return 0; })
		.attr("height", function(d) { return 60; })
		.attr("width", 1);

	// Killed or Wounded
	vis.circle.append("circle")
		.attr("class", "timeline-circle")
		.attr("cx",1)
		.attr("cy", function(d) {
			return ((60-2)- d.index*4);
		})
		.attr("r", 2)
		.style("fill",function(d) {
			if(d.kia >0){
				return "#de2d26";
			}else{
				return "#494949";
			}

		});

	// Add year titles
	vis.svg.append("text")
		.attr("style","font-size:10;")
		.attr("x",0)
		.attr("y",0)
		.text("2014");
	vis.svg.append("text")
		.attr("style","font-size:10;")
		.attr("x",vis.width-20)
		.attr("y",0)
		.text("2015");

	// Initialize brush component
	vis.brush = d3.svg.brush()
		.x(vis.x)
		.on("brush", brushed);

	// Append brush component
	vis.svg.append("g")
		.attr("class", "x brush")
		.call(vis.brush)
		.selectAll("rect")
		.attr("y", -6)
		.attr("height", vis.height + 7);

}

