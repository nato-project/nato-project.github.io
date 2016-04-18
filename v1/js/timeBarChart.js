
/*
 * TimeBarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

TimeBarChart = function(_parentElement, _data, _margin){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 * Initialize time bar chart aligned with heat matrix
 */

TimeBarChart.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 15, right: 5, bottom: 15, left: 150};

    vis.width = matrixW;
    vis.height = 100;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

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
        .range([0, vis.height]);

    // Create a bar for each month
    var colWidth = vis.width/24;
    vis.svg.append("g").selectAll(".monthBar")
        .data(vis.barData)
        .enter()
        .append("rect")
        .attr("class", "monthBar")
        .attr("x", function(d,i) {return i*colWidth;})
        .attr("y", function(d) {return vis.height-vis.yScale(d);})
        .attr("width", colWidth-1)
        .attr("height", function(d) {return vis.yScale(d);})
        .style("fill", "orange");
    
    // Create bar labels
    vis.svg.append("g").selectAll(".monthBarLabel")
    .data(vis.barData)
    .enter()
    .append("text")
    .attr("class", "monthBarLabel")
    .attr("x", function(d,i) {return (i+0.5)*colWidth-8;})
    .attr("y", function(d) {return vis.height-vis.yScale(d)-3;})
    .text(function(d) {return d;});

    // Custom bar axis labels
    vis.svg.append("g").selectAll(".monthLabel")
    .data(vis.barData)
    .enter()
    .append("text")
    .attr("class", "monthLabel")
    .attr("x", function(d,i) {return (i)*colWidth+5;})
    .attr("y", function(d) {return vis.height+11;})
    .text(function(d,i) {
    	var year = i>11 ? "15" : "14";
    	var month = i>11 ? (i-11): i+1;
    	return month + "/" + year;
    })
    .style("font-size", "10px");

}

