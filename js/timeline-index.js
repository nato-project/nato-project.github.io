
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
        this.width = 523;
    }
    if(_height){
        this.height = _height
    }else{
        this.height = 190;
    }


    this.initVis();
}

TimelineIndex.prototype.initVis = function(){
    var vis = this;

    vis.margin = {top: 10, right: 50, bottom: 20, left: 50};

    vis.width = vis.width - vis.margin.left - vis.margin.right,
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

    //.attr("width", vis.width + vis.margin.left + vis.margin.right)
    //    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    // SVG drawing area
    vis.svgmain = d3.select("#" + vis.parentElement).append("svg")
        .attr("x",0)
        .attr("y",0)
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
    vis.svg.select("timeline-axis")
        .selectAll("text")
        .attr("style","font-size:25;");

    // Prepare Data for Timeline
    vis.data = _.orderBy(vis.data, ['date'],['asc']);
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

    var increment = 50;

    // Incidents
    vis.bar.append("rect")
        .attr("y", function(d) { return 20; })
        .attr("height", function(d) { return vis.height-20; })
        .attr("width", 1)
        .attr("fill",COMMON_COLORS.INCIDENT)
        .style("opacity", 0)
        .transition()
        .delay(function(d, i) {
            increment = increment +5;
            return increment;
        })
        .duration(250)
        .style("opacity", 1);

    // Killed or Wounded
    var increment = 50;
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
        })
        .style("opacity", 0)
        .transition()
        .delay(function(d, i) {
            increment = increment +15;
            return increment;
        })
        .duration(250)
        .style("opacity", 1);

    // Legend
    vis.svgmain.append("svg:image")
        .attr("x",100)
        .attr("y",2)
        .attr("width",24)
        .attr("height",24)
        .attr('xlink:href',"img/person-killed.svg");
    vis.svgmain.append("text")
        .attr("style","font-size:15;")
        .attr("x",125)
        .attr("y",20)
        .text("Killed");
    vis.svgmain.append("svg:image")
        .attr("x",170)
        .attr("y",2)
        .attr("width",24)
        .attr("height",24)
        .attr('xlink:href',"img/person-wounded.svg");
    vis.svgmain.append("text")
        .attr("style","font-size:15;")
        .attr("x",195)
        .attr("y",20)
        .text("Wounded");
    vis.svgmain.append("rect")
        .attr("x",280)
        .attr("y", 5)
        .attr("height", 15 )
        .attr("width", 2)
        .attr("fill",COMMON_COLORS.INCIDENT);
    vis.svgmain.append("text")
        .attr("style","font-size:15;")
        .attr("x",290)
        .attr("y",20)
        .text("Incident");


    // Add year titles
    vis.svgmain.append("text")
        .attr("style","font-size:15;")
        .attr("x",2)
        .attr("y",vis.height+23)
        .text("2014");
    vis.svgmain.append("text")
        .attr("style","font-size:15;")
        .attr("x",vis.width+40)
        .attr("y",vis.height+25)
        .text("2015");


}