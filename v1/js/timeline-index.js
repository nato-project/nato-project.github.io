
/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

TimelineIndex = function(_parentElement, _data,_width,_height){
    this.parentElement = _parentElement;
    this.data = _data;

    if(_width){
        this.width = _width;
    }else{
        this.width = 900;
    }
    if(_height){
        this.height = _height
    }else{
        this.height = 200;
    }


    this.initVis();
}

TimelineIndex.prototype.initVis = function(){
    var vis = this;

    vis.margin = {top: 10, right: 10, bottom: 20, left: 10};

    vis.width = vis.width - vis.margin.left - vis.margin.right,
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
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
        .attr("y", function(d) { return 20; })
        .attr("height", function(d) { return vis.height-20; })
        .attr("width", 1);

    // Killed or Wounded
    //vis.circle.append("circle")
    //    .attr("class", "timeline-circle")
    //    .attr("cx",1)
    //    .attr("cy", function(d) {
    //        return ((vis.height-12)- d.index*24);
    //    })
    //    .attr("r", 12)
    //    .style("fill",function(d) {
    //        if(d.kia >0){
    //            return "#de2d26";
    //        }else{
    //            return "#494949";
    //        }
    //
    //    });
    vis.circle.append("svg:image")
        .attr("x",1)
        .attr("y", function(d) {
            return ((vis.height-24)- d.index*24);
        })
        .attr("width",24)
        .attr("height",24)
        .attr('xlink:href',function(d){
            if(d.kia >0){
                return "img/person-killed.svg";
            }else{
                return "img/person-wounded.svg";
            }
        });

    // Add year titles
    vis.svg.append("text")
        .attr("style","font-size:20;")
        .attr("x",0)
        .attr("y",15)
        .text("2014");
    vis.svg.append("text")
        .attr("style","font-size:20;")
        .attr("x",vis.width-40)
        .attr("y",15)
        .text("2015");


}