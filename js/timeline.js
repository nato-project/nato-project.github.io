
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
		this.width = 750;
	}


	this.initVis();
}


/*
 * Initialize timeline chart with brushing component
 */

Timeline.prototype.initVis = function(){
	var vis = this; // read about the this

	vis.margin = {top: 10, right: 30, bottom: 20, left: 30};

	vis.width = vis.width - vis.margin.left - vis.margin.right,
	vis.height = 90 - vis.margin.top - vis.margin.bottom;

	// SVG drawing area
	vis.svgmain = d3.select("#" + vis.parentElement).append("svg")
		.attr("x",0)
		.attr("y",0)
		.attr("class", "img-responsive")
		.attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom));

	vis.svg = vis.svgmain.append("g")
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

	// Prepare Data for Timeline
	vis.killed_wounded = [];
	vis.data.forEach(function (d, i) {
		d.cummilative = i+1;
		var index =0;
		for(var i=0;i< d.kia;i++) {
			vis.killed_wounded.push({date: d.date,kia:1,wia:0,index:index++});
		}
		for(var i=0;i< d.wia;i++) {
			vis.killed_wounded.push({date: d.date,kia:0,wia:1,index:index++});
		}
	});

	//var line = d3.svg.line()
	//	.x(function(d) { return vis.x(d.date); })
	//	.y(function(d) { return vis.y(d.cummilative); });

	// Create svg elements
	vis.incidentGroup = vis.svg.append("g");
	vis.circleGroup = vis.svg.append("g");

	vis.incident = vis.incidentGroup.selectAll("g")
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
	vis.incident.append("rect")
		.attr("y", function(d) { return 0; })
		.attr("height", function(d) { return 60; })
		.attr("width", 1)
		.attr("fill",COMMON_COLORS.INCIDENT);
	//vis.incident.append("circle")
	//	.attr("class", "timeline-circle")
	//	.attr("cx",1)
	//	.attr("cy",30)
	//	.attr("r", 2)
	//	.style("fill",COMMON_COLORS.INCIDENT);

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
				return COMMON_COLORS.KILLED;
			}else{
				return COMMON_COLORS.WOUNDED;
			}

		});

	// Legend
	vis.svgmain.append("circle")
		.attr("class", "timeline-circle")
		.attr("cx",50)
		.attr("cy",5)
		.attr("r", 2)
		.style("fill",COMMON_COLORS.KILLED);
	vis.svgmain.append("text")
		.attr("style","font-size:8;")
		.attr("x",55)
		.attr("y",7)
		.text("Killed");
	vis.svgmain.append("circle")
		.attr("class", "timeline-circle")
		.attr("cx",90)
		.attr("cy",5)
		.attr("r", 2)
		.style("fill",COMMON_COLORS.WOUNDED);
	vis.svgmain.append("text")
		.attr("style","font-size:8;")
		.attr("x",95)
		.attr("y",7)
		.text("Wounded");
	vis.svgmain.append("rect")
		.attr("x",140)
		.attr("y", 0)
		.attr("height", 7 )
		.attr("width", 1)
		.attr("fill",COMMON_COLORS.INCIDENT);
	vis.svgmain.append("text")
		.attr("style","font-size:8;")
		.attr("x",145)
		.attr("y",7)
		.text("Incident");


	// Add year titles
	vis.svgmain.append("text")
		.attr("style","font-size:10;")
		.attr("x",2)
		.attr("y",vis.height+23)
		.text("2014");
	vis.svgmain.append("text")
		.attr("style","font-size:10;")
		.attr("x",vis.width+35)
		.attr("y",vis.height+23)
		.text("2015");

	// Initialize brush component
	vis.brush = d3.svg.brush()
		.x(vis.x)
		.extent([new Date(2014, 0, 15),new Date(2015, 11, 15)])
		.on("brush", brushed);

	// Append brush component
	vis.gBrush = vis.svg.append("g")
		.attr("class", "x brush")
		.call(vis.brush);

	vis.gBrush.selectAll("rect")
		.attr("y", 0)
		.attr("height", vis.height);

	vis.gBrush.selectAll('.resize').append('path').attr('d', resizePath);

	// Taken from crossfilter (http://square.github.com/crossfilter/)
	function resizePath(d) {

		var e = +(d == 'e'),
			x = e ? 1 : -1,
			y = vis.height / 3;
		return 'M' + (.5 * x) + ',' + y
			+ 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
			+ 'V' + (2 * y - 6)
			+ 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
			+ 'Z'
			+ 'M' + (2.5 * x) + ',' + (y + 8)
			+ 'V' + (2 * y - 8)
			+ 'M' + (4.5 * x) + ',' + (y + 8)
			+ 'V' + (2 * y - 8);
	}

}

