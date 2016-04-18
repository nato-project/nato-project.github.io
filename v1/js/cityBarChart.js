
/*
 * CityBarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

CityBarChart = function(_parentElement, _data, _margin){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 * Initialize bar chart aligned on heat matrix
 */

CityBarChart.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 5, right: 20, bottom: 5, left: 5};

    vis.width = 200;
    vis.height = matrixH;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Create bar data
    vis.barData = [];
    vis.data.forEach(function(d) {
        vis.barData.push(d3.sum(d.IEDevents));
    })

    // Create scales
    var maxValue = d3.max(vis.barData);
    vis.xScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([0, vis.width]);

    // Create a bar for each month
    var rowHeight = vis.height/vis.data.length;
    vis.svg.append("g").selectAll(".cityBar")
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
    vis.svg.append("g").selectAll(".cityBarLabel")
    .data(vis.barData)
    .enter()
    .append("text")
    .attr("class", "cityBarLabel")
    .attr("x", function(d) {return 3+vis.xScale(d);})
    .attr("y", function(d,i) {return (i+0.5)*rowHeight + 5;})
    .text(function(d) {return d;});
}

