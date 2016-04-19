/*
 * Counts - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- the ied data
 */

Counts = function(_parentElement, _iedData,_width,_height){
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

    });

    //var sectionWidth = vis.width/3;
    //
    //vis.killedGroup = vis.svg.append("g");
    //vis.woundedGroup = vis.svg.append("g");
    //vis.totalGroup = vis.svg.append("g");
    //
    //// Add circles
    //vis.killedGroup.append("circle")
    //    .attr("cx",sectionWidth*0.25)
    //    .attr("cy",vis.height/2)
    //    .attr("r",70)
    //    .style("fill","dfdfdf")
    //    .style("stroke-width",3)
    //    .style("stroke","#494949");
    //vis.woundedGroup.append("circle")
    //    .attr("cx",sectionWidth+sectionWidth*0.25)
    //    .attr("cy",vis.height/2)
    //    .attr("r",70)
    //    .style("fill","dfdfdf")
    //    .style("stroke-width",3)
    //    .style("stroke","#494949");
    //vis.totalGroup.append("circle")
    //    .attr("cx",sectionWidth+sectionWidth+sectionWidth*0.25)
    //    .attr("cy",vis.height/2)
    //    .attr("r",70)
    //    .style("fill","dfdfdf")
    //    .style("stroke-width",3)
    //    .style("stroke","#494949");
    //
    //// Add icons
    //vis.killedGroup.append("svg:image")
    //    .attr("x",sectionWidth*0.10)
    //    .attr("y",vis.height/2)
    //    .attr("width",100)
    //    .attr("height",100)
    //    .attr('xlink:href',"img/person-killed.svg");
    //vis.woundedGroup.append("svg:image")
    //    .attr("x",sectionWidth+sectionWidth*0.10)
    //    .attr("y",vis.height/2)
    //    .attr("width",100)
    //    .attr("height",100)
    //    .attr('xlink:href',"img/person-wounded.svg");
    //vis.totalGroup.append("svg:image")
    //    .attr("x",sectionWidth+sectionWidth+sectionWidth*0.10)
    //    .attr("y",vis.height/2)
    //    .attr("width",100)
    //    .attr("height",100)
    //    .attr('xlink:href',"img/bomb.svg");

    // Set Data as counter
    //vis.data.forEach(function (d, i) {
    //
    //});

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
