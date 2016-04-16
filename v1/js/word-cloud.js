
WordCloud = function(_parentElement, _iedData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;

    this.displayData = []; // see data wrangling
    this.filter = [];

    this.initVis();
}

/*
 * Initialize area chart with brushing component
 */
WordCloud.prototype.initVis = function() {
    var vis = this; // read about the this

    vis.margin = {top: 0, right: 0, bottom: 0, left: 0};

    vis.width = 900 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Wrangle and update
    vis.wrangleData();

}

WordCloud.prototype.wrangleData = function() {

    var vis = this; // read about the this

    // Filter with timeline
    vis.displayData = vis.iedData;
    if (vis.filter.length > 0) {
        vis.displayData = vis.iedData.filter(function (d) {
            var first = new Date(d.date) >= vis.filter[0];
            var second = new Date(d.date) <= vis.filter[1];
            return first && second;
        });
    }

    // Update the visualization
    vis.updateVis();

}

WordCloud.prototype.updateVis = function() {

    var vis = this; // read about the this

}
