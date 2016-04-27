/*
 * Counts - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

Counts = function(_parentElement, _iedData,_width,_height,_animate){
    this.parentElement = _parentElement;
    this.iedData = _iedData;

    this.displayData = this.iedData;
    this.filter = [];

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
    this.animate = false;
    if(_animate){
        this.animate = _animate;
    }


    this.initVis();
}

Counts.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 10, right: 10, bottom: 20, left: 10};

    vis.width = vis.width - vis.margin.left - vis.margin.right,
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.parentDiv = d3.select("#" + vis.parentElement);
    // Load SVG file into div
    d3.xml('img/counts.svg', 'image/svg+xml', function (error, data) {
        vis.parentDiv.node().appendChild(data.documentElement);

        // Get the Picture wheel layers
        vis.svg = vis.parentDiv.select('svg');

        vis.counts_total = vis.svg.select("#counts_total");
        vis.counts_wia = vis.svg.select("#counts_wia");
        vis.counts_kia = vis.svg.select("#counts_kia");

        // Animate the counts
        var total =650;
        var kia =65;
        var wia =152;
        var duration = 4000;
        if(vis.animate){
            // Total Count
            vis.counts_total.transition()
                .duration(duration)
                .tween("text", function() {
                    var i = d3.interpolateRound(0, total);
                    return function(t) {
                        this.textContent = i(t);
                    };
                });
            // Killed
            vis.counts_kia.transition()
                .duration(duration)
                .tween("text", function() {
                    var i = d3.interpolateRound(0, kia);
                    return function(t) {
                        this.textContent = i(t);
                    };
                });

            // Wounded
            vis.counts_wia.transition()
                .duration(duration)
                .tween("text", function() {
                    var i = d3.interpolateRound(0, wia);
                    return function(t) {
                        this.textContent = i(t);
                    };
                });
        }

    });

}

Counts.prototype.wrangleData = function() {

    var vis = this;

    // Filter with timeline
    vis.displayData = vis.iedData;
    if (vis.filter.length > 0) {
        vis.displayData = vis.iedData.filter(function (d) {
            var first = new Date(d.date) >= vis.filter[0];
            var second = new Date(d.date) <= vis.filter[1];
            return first && second;
        });
    }

    vis.counts_kia_value =0;
    vis.counts_wia_value = 0;
    vis.counts_total_value =vis.displayData.length;
    vis.displayData.forEach(function(d) {
        vis.counts_kia_value += d.kia;
        vis.counts_wia_value += d.wia;
    });

    // Update the visualization
    vis.updateVis();
}

Counts.prototype.updateVis = function() {

    var vis = this;

    vis.counts_kia.text(vis.counts_kia_value);
    vis.counts_wia.text(vis.counts_wia_value);
    vis.counts_total.text(vis.counts_total_value);

}
