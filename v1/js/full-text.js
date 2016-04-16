
FullText = function(_parentElement, _iedData,_textLinkData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;
    this.textLinkData = _textLinkData;

    this.nodes = [];
    this.links = [];
    this.displayData = []; // see data wrangling
    this.filter = [];

    this.initVis();
}

/*
 * Initialize area chart with brushing component
 */
FullText.prototype.initVis = function() {
    var vis = this; // read about the this

    vis.margin = {top: 0, right: 0, bottom: 0, left: 0};

    vis.width = 800 - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.color = d3.scale.category10();
    vis.color.domain(d3.keys(this.iedData.type));

    vis.findNode = function(id){
        return vis.iedData[id];
    }

    vis.iedData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
    });
    vis.textLinkData.forEach(function(d) {
        vis.links.push({source: d.s_id-1,target: d.t_id-1,cs_value: d.cs_value});
    });
    console.log(vis.nodes);
    console.log(vis.links);


    // 1) INITIALIZE FORCE-LAYOUT
    vis.force = d3.layout.force()
        .size([vis.width, vis.height])
        .friction(.9)
        .linkDistance(30)
        .charge(-80)
        .gravity(.8);

    // 2a) DEFINE 'NODES' AND 'EDGES'
    vis.force.nodes(vis.nodes)
        .links(vis.links);

    // 2b) START RUNNING THE SIMULATION
    vis.force.start();

    // 3) DRAW THE LINKS (SVG LINE)
    vis.linkItems = vis.svg.selectAll(".force-layout-link")
        .data(vis.links)
        .enter()
        .append("line")
        .attr("class", "force-layout-link")
        .style("stroke", function(d) {
            return vis.color(vis.findNode(d.source.index).type);
        })
        .style("stroke-width", function(d) {
            return d.cs_value*5;
        });

    // 4) DRAW THE NODES (SVG CIRCLE)
    vis.nodeItems = vis.svg.selectAll(".force-layout-node")
        .data(vis.nodes)
        .enter().append("circle")
        .attr("class", "force-layout-node")
        .attr("r", 3)
        .style("fill", function(d) { return vis.color(vis.findNode(d.index).type); })
        .style("stroke", function(d) { return vis.color(vis.findNode(d.index).type); });

    // 5) Force TICK
    vis.force.on("tick", function() {



        // Update edge coordinates
        vis.linkItems.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        // Update node coordinates
        vis.nodeItems.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // Update Node Text
        //text.attr("x", function(d) { return d.x; })
        //    .attr("y", function(d) { return d.y; });
    });

    // Legend
    vis.legend = vis.svg.append("g")
        .attr("transform", "translate(" + (5) + "," + (10) + ")")
        .selectAll("g")
        .data(vis.color.range())
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });
    vis.legendbox = vis.legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", function(d){return d;});
    vis.legendlabels = vis.legend.append("text")
        .attr("class", "force-layout-legend-labels")
        .attr("x", 25)
        .attr("y", 15)
        .style("fill", function(d){return d;})
        .text(function(d,i){
            return vis.color.domain()[i];
        });

    // Tool Tip
    var node;
    vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        node = vis.findNode(d.index);
        var tipContent = "";
        tipContent += "<div class='tooltip-content text-center'>" + node.text + "</div>";
        tipContent += "<div class='tooltip-content text-center'>Region: " + node.region + " / City: "+node.city+"</div>";
        tipContent += "<div class='tooltip-content text-center'>Killed: " + node.kia + " / Wounded: "+node.wia+"</div>";

        return tipContent;
    });

    // Invoke tooltip
    vis.nodeItems.on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);
    vis.nodeItems.call(vis.tip);

    // Wrangle and update
    //vis.wrangleData();

}

FullText.prototype.wrangleData = function() {

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

FullText.prototype.updateVis = function() {

    var vis = this; // read about the this

    vis.nodes =[];
    vis.displayData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
    });
    var src,tgt;
    vis.links = [];
    vis.textLinkData.forEach(function(d) {
        src = _.findIndex(vis.nodes,function(o){ return o.id == d.s_id});
        tgt = _.findIndex(vis.nodes,function(o){ return o.id == d.t_id});
        //console.log(src + " / "+ tgt);
        if(src > -1 && tgt > -1) {
            vis.links.push({source: src, target: tgt, cs_value: d.cs_value});
        }
    });
    //console.log(vis.nodes);
    //console.log(vis.links);

    vis.force.stop();

    vis.force.nodes(vis.nodes)
        .links(vis.links);

    // 2b) START RUNNING THE SIMULATION
    vis.force.start();

    // Update Links
    vis.linkItems = vis.linkItems.data(vis.links);
    vis.linkItems.exit().remove();
    vis.linkItems.enter().append("line")
        .attr("class", "force-layout-link")
        .style("stroke", function(d) {
            return vis.color(vis.findNode(d.source.index).type);
        })
        .style("stroke-width", function(d) {
            return d.cs_value*5;
        });


    // Update Nodes
    vis.nodeItems = vis.nodeItems.data(vis.nodes);
    vis.nodeItems.exit().remove();
    vis.nodeItems.enter()
        .append("circle")
        .attr("class", "force-layout-node")
        .attr("r", 3)
        .style("fill", function(d) { return vis.color(vis.findNode(d.index).type); })
        .style("stroke", function(d) { return vis.color(vis.findNode(d.index).type); });

    // Invoke tooltip
    vis.nodeItems.on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);
    vis.nodeItems.call(vis.tip);

}