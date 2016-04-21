
FullText = function(_parentElement, _iedData,_textLinkData,_topwordsData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;
    this.textLinkData = _textLinkData;
    this.topwordsData = _topwordsData;

    this.displayData = this.iedData;
    this.displayTextLinkData = this.textLinkData;
    this.nodes = [];
    this.links = [];
    this.nodeWords = [];
    this.filter = [];
    this.nodeFilter = [];
    this.threshold =50;
    this.displaytype = "incidenttype";
    this.dateFormat = d3.time.format("%b %d %Y");
    this.nodeWords = [];

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
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.color = d3.scale.category10();
    vis.color.domain(d3.keys(this.iedData.type));

    // Link width
    vis.linkWidth = d3.scale.linear();
    vis.linkWidth.domain([0.5,1]).range([1,10]);

    // Node Text Font Size
    vis.nodeTextFontSize = d3.scale.linear();
    vis.nodeTextFontSize.domain([1,600]).range([10,50]);

    vis.findNode = function(id){
        return vis.displayData[id];
    }

    // Create nodes and links
    vis.iedData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
    });
    vis.textLinkData.forEach(function(d) {
        vis.links.push({source: d.s_id-1,target: d.t_id-1,cs_value: d.cs_value});
    });
    //console.log(vis.nodes);
    //console.log(vis.links);

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

    vis.generateNodeWords();

    // 2b) START RUNNING THE SIMULATION
    vis.force.start();

    // 3) DRAW THE LINKS (SVG LINE)
    vis.linkItems = vis.svg.append("g").selectAll(".force-layout-link")
        .data(vis.links)
        .enter()
        .append("line")
        .attr("class", "force-layout-link")
        .style("stroke", function(d) {
            return vis.color(vis.findNode(d.source.index).type);
        })
        .style("stroke-width", function(d) {
            return vis.linkWidth(d.cs_value);
        });

    // 4) DRAW THE NODES (SVG CIRCLE)
    vis.nodeItems = vis.svg.append("g").selectAll(".force-layout-node")
        .data(vis.nodes)
        .enter().append("circle")
        .attr("class", "force-layout-node")
        .attr("r", 3)
        .style("fill", function(d) { return vis.color(vis.findNode(d.index).type); })
        .style("stroke", function(d) { return vis.color(vis.findNode(d.index).type); });

    // Node Text
    vis.nodeTextItems = vis.svg.append("g").selectAll(".force-layout-text")
        .data(vis.nodeWords)
        .enter().append("text")
        .attr("class", "force-layout-text")
        .style("font-size", function(d) { return d.font_size; })
        .style("opacity", function(d) {
            return 1;
        })
        .style("stroke", "#000000")
        .text(function(d) { return d.words; });


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
        vis.nodeTextItems.attr("x", function(d) {
                var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
                if(node){
                    return node.x-100;
                }else{
                    return 2000;
                }

            })
            .attr("y", function(d) {
                var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
                if(node){
                    return node.y;
                }else{
                    return 2000;
                }
            });
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
        })
        .on("click", function(d,i) {
            var nodes = _.filter(vis.displayData, function(o) { return o.type==vis.color.domain()[i]; });
            vis.displayText(nodes);
        });

    vis.textTimeline = d3.select("#text-timeline");

    // Tool Tip
    //var node;
    //vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    //    node = vis.findNode(d.index);
    //    var tipContent = "";
    //    tipContent += "<div class='tooltip-content text-center'>" + node.text + "</div>";
    //    tipContent += "<div class='tooltip-content text-center'>Region: " + node.region + " / City: "+node.city+"</div>";
    //    tipContent += "<div class='tooltip-content text-center'>Killed: " + node.kia + " / Wounded: "+node.wia+"</div>";
    //
    //    return tipContent;
    //});
    //
    //// Invoke tooltip
    //vis.nodeItems.on('mouseover', vis.tip.show)
    //    .on('mouseout', vis.tip.hide);
    //vis.nodeItems.call(vis.tip);

    // Brush
    vis.brush = d3.svg.brush()
        .x(d3.scale.linear().domain([0, vis.width]).range([0, vis.width]))
        .y(d3.scale.linear().domain([0, vis.height]).range([0, vis.height]))
        .on("brush", function(){
            vis.nodeFilter = vis.brush.empty() ? [] : vis.brush.extent();
            console.log(vis.nodeFilter);

            var extent = vis.brush.extent();
            //d3.selectAll(".force-layout-node").select("circle").classed("selected", function(d) {
            //
            //    return d.selected = (extent[0][0] <= d.x && d.x < extent[1][0]
            //    && extent[0][1] <= d.y && d.y < extent[1][1]);
            //
            //});
            var selected = d3.selectAll(".force-layout-node").filter(function(d){
                return (extent[0][0] <= d.x && d.x < extent[1][0] && extent[0][1] <= d.y && d.y < extent[1][1]);
            });
            console.log(selected);
        });

    // Append brush component
    vis.svg.append("g")
        .attr("class", "x brush")
        .call(vis.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", vis.height + 7);

    // Wrangle and update
    //vis.wrangleData();

}

FullText.prototype.wrangleData = function() {

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

    // Build Nodes and links from new dataset
    vis.nodes =[];
    vis.displayData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
    });
    var src,tgt;
    vis.links = [];
    vis.displayTextLinkData = [];
    vis.textLinkData.forEach(function(d) {
        if(d.cs_value >= (vis.threshold/100)){
            src = _.findIndex(vis.nodes,function(o){ return o.id == d.s_id});
            tgt = _.findIndex(vis.nodes,function(o){ return o.id == d.t_id});
            //console.log(src + " / "+ tgt);
            if(src > -1 && tgt > -1) {
                vis.links.push({source: src, target: tgt, cs_value: d.cs_value});
                vis.displayTextLinkData.push({s_id: d.s_id,t_id: d.t_id,cs_value: d.cs_value});
            }
        }
    });

    vis.generateNodeWords();

    // Update the visualization
    vis.updateVis();

}

FullText.prototype.updateVis = function() {

    var vis = this; // read about the this

    //console.log(vis.displaytype);

    // Update Color
    if(vis.displaytype == "incidenttype"){
        vis.color = d3.scale.category10();
        vis.color.domain(d3.keys(this.displayData.type));
    }else{
        vis.color = d3.scale.ordinal().domain(["Killed","Wounded","No Casualities"]).range(["#de2d26","#494949", "#dfdfdf"]);
    }
    //console.log(vis.color.domain());
    //console.log(vis.color.range());

    vis.force.stop();

    vis.force.nodes(vis.nodes)
        .links(vis.links);

    // 2b) START RUNNING THE SIMULATION
    vis.force.start();

    // Update Links
    vis.linkItems = vis.linkItems.data(vis.links);
    vis.linkItems.exit().remove();
    vis.linkItems.enter().append("line")
        .attr("class", "force-layout-link");
    vis.linkItems.style("stroke", function(d) {
            if(vis.displaytype == "incidenttype") {
                return vis.color(vis.findNode(d.source.index).type);
            }else{
                if(vis.findNode(d.source.index).kia >0){
                    return vis.color("Killed");
                }else if(vis.findNode(d.source.index).wia >0){
                    return vis.color("Wounded");
                }else{
                    return vis.color("No Casualities");
                }
            }
        })
        .style("stroke-width", function(d) {
            return vis.linkWidth(d.cs_value);
        });


    // Update Nodes
    vis.nodeItems = vis.nodeItems.data(vis.nodes);
    vis.nodeItems.exit().remove();
    vis.nodeItems.enter()
        .append("circle")
        .attr("class", "force-layout-node")
        .attr("r", 3);

    vis.nodeItems.style("fill", function(d) {
            if(vis.displaytype == "incidenttype") {
                return vis.color(vis.findNode(d.index).type);
            }else{
                if(vis.findNode(d.index).kia >0){
                    return vis.color("Killed");
                }else if(vis.findNode(d.index).wia >0){
                    return vis.color("Wounded");
                }else{
                    return vis.color("No Casualities");
                }
            }
        })
        .style("stroke", function(d) {
            if(vis.displaytype == "incidenttype") {
                return vis.color(vis.findNode(d.index).type);
            }else{
                if(vis.findNode(d.index).kia >0){
                    return vis.color("Killed");
                }else if(vis.findNode(d.index).wia >0){
                    return vis.color("Wounded");
                }else{
                    return vis.color("No Casualities");
                }
            }
        });

    // Update Text
    vis.nodeTextItems = vis.nodeTextItems.data(vis.nodeWords);
    vis.nodeTextItems.exit().remove();
    vis.nodeTextItems.enter()
        .append("text")
        .attr("class", "force-layout-text")
        .text(function(d) { return d.words; });

    vis.nodeTextItems.style("font-size", function(d) { return d.font_size; })
        .style("opacity", function(d) {
            return 1;
        })
        .style("stroke", "#000000")
        .text(function(d) { return d.words; });


    // Legend
    vis.legend = vis.legend.data(vis.color.range());
    vis.legend.exit().remove();
    vis.legend.enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });
    vis.legendbox.remove();
    vis.legendbox = vis.legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", function(d){return d;});
    vis.legendlabels.remove();
    vis.legendlabels = vis.legend.append("text")
        .attr("class", "force-layout-legend-labels")
        .attr("x", 25)
        .attr("y", 15)
        .style("fill", function(d){return d;})
        .text(function(d,i){
            return vis.color.domain()[i];
        })
        .on("click", function(d,i) {
            if(vis.displaytype == "incidenttype") {
                var nodes = _.filter(vis.displayData, function (o) {
                    return o.type == vis.color.domain()[i];
                });
                vis.displayText(nodes);
            }else{
                if(vis.color.domain()[i] == "Killed"){
                    var nodes = _.filter(vis.displayData, function (o) {
                        return o.kia >0;
                    });
                    vis.displayText(nodes);
                }else if(vis.color.domain()[i] == "Wounded"){
                    var nodes = _.filter(vis.displayData, function (o) {
                        return o.wia >0;
                    });
                    vis.displayText(nodes);
                }else{
                    var nodes = _.filter(vis.displayData, function (o) {
                        return o.kia ==0 && o.wia ==0;
                    });
                    vis.displayText(nodes);
                }
            }
        });

    // Invoke tooltip
    //vis.nodeItems.on('mouseover', vis.tip.show)
    //    .on('mouseout', vis.tip.hide);
    //vis.nodeItems.call(vis.tip);

}

FullText.prototype.displayText = function(nodes){
    var vis = this;

    console.log(nodes);

    vis.textTimeline.selectAll("div").remove();

    vis.textTimelineBlock = vis.textTimeline.selectAll("div")
        .data(nodes)
        .enter()
        .append("div")
        .attr("class","cd-timeline-block");

    vis.textTimelineBlockImg = vis.textTimelineBlock.append("div")
        .attr("class","cd-timeline-img cd-picture")
        .append("img")
        .attr("src",function(d){
            if(d.kia >0){
                return "img/person-killed.svg";
            }else if(d.wia >0){
                return "img/person-wounded.svg";
            }else {
                return "img/bomb.svg";
            }
        });

    vis.textTimelineBlockContent = vis.textTimelineBlock.append("div").attr("class","cd-timeline-content");
    vis.textTimelineBlockContent.append("h2").text(function(d){
        return vis.dateFormat(d.date);
    });
    vis.textTimelineBlockContent.append("p").text(function(d){
        return d.text;
    });
    vis.textTimelineBlockContent.append("span")
        .attr("class","cd-date")
        .text(function(d){
            return d.kia+" killed, "+ d.wia+" wounded in "+ d.city+", "+ d.region;
        });

}

FullText.prototype.generateNodeWords = function (){
    var vis = this;

    vis.nodeWords = [];
    var maxNodes = 3;
    if(vis.displayTextLinkData.length >400){
        maxNodes = 15;
    }else if(vis.displayTextLinkData.length >200){
        maxNodes = 10;
    }else if(vis.displayTextLinkData.length >100){
        maxNodes = 5;
    }

    console.log(vis.displayTextLinkData.length);

    // Create Node words
    var topNodes = d3.nest()
        .key(function(d) { return d.s_id; })
        .entries(vis.displayTextLinkData);
    topNodes.forEach(function(d) {
        d.length = d.values.length;
    });

    //console.log("--------topNodes-------");
    //console.log(topNodes);
    topNodes = _.orderBy(topNodes, ['length'],['desc']);
    //console.log(topNodes);
    for(var i=0;i<topNodes.length;i++){
        var parent = topNodes[i].key;
        var children = topNodes[i].values;

        for(var j=i+1;j<topNodes.length;j++){
            //_.remove(topNodes[j].values,function(o) { return o.t_id == parent; });

            // Find if parent node exist as a child for any other node and grab all its children
            var found = _.find(topNodes[j].values, function(o) { return o.t_id== parent; });
            if(found){
                //console.log(topNodes[i].values.length);
                topNodes[i].values = topNodes[i].values.concat(topNodes[j].values);
                topNodes[i].length = topNodes[i].values.length;
                topNodes[j].values = [];
                topNodes[j].length = 0;
            }


            topNodes[i].values.forEach(function(child) {
                // For each child see if the child is another parent and grab all its nodes
                if(child.t_id == topNodes[j].key){
                    topNodes[i].values = topNodes[i].values.concat(topNodes[j].values);
                    topNodes[i].length = topNodes[i].values.length;
                    topNodes[j].values = [];
                    topNodes[j].length = 0;
                }
                // For each child see if the child is another parents child and grab all its nodes
                found = _.find(topNodes[j].values, function(o) { return o.t_id== child.t_id; });
                if(found){
                    topNodes[i].values = topNodes[i].values.concat(topNodes[j].values);
                    topNodes[i].length = topNodes[i].values.length;
                    topNodes[j].values = [];
                    topNodes[j].length = 0;
                }
            });
        }
    }
    topNodes = _.orderBy(topNodes, ['length'],['desc']);
    //console.log(topNodes);


    topNodes = _.slice(topNodes,0,maxNodes);
    //console.log(topNodes);

    // Option 1: Get the top 3 words size for the top nodes
    //topNodes.forEach(function(d) {
    //    var parent = _.find(vis.topwordsData, function(o) { return o.id== d.key; });
    //    parent.font_size =5;
    //
    //    d.values.forEach(function(c){
    //        var child = _.find(vis.topwordsData, function(o) { return o.id== c.t_id; });
    //        var font_size = 5;
    //        if((parent.word_1 == child.word_1) || (parent.word_1 == child.word_2) || (parent.word_1 == child.word_3)){
    //            parent.font_size++;
    //        }
    //        if((parent.word_2 == child.word_1) || (parent.word_2 == child.word_2) || (parent.word_2 == child.word_3)){
    //            parent.font_size++;
    //        }
    //        if((parent.word_3 == child.word_1) || (parent.word_3 == child.word_2) || (parent.word_3 == child.word_3)){
    //            parent.font_size++;
    //        }
    //    });
    //
    //    if(parent.font_size > 30){
    //        parent.font_size =30;
    //    }
    //    vis.nodeWords.push(parent);
    //});

    // Option 2: Get the top 3 words for each node - Based on word count (Words already ranked based on score in topwords)
    topNodes.forEach(function(d) {
        var parent = _.find(vis.topwordsData, function(o) { return o.id== d.key; });
        var allWords = [];
        allWords.push({word:parent.word_1,count:1});
        allWords.push({word:parent.word_2,count:1});
        allWords.push({word:parent.word_3,count:1});

        d.values.forEach(function(c){
            var child = _.find(vis.topwordsData, function(o) { return o.id== c.t_id; });

            var found = _.find(allWords,function(o) { return o.word == child.word_1; });
            if(found){
                found.count++;
            }else{
                allWords.push({word:child.word_1,count:1});
            }
            found = _.find(allWords,function(o) { return o.word == child.word_2; });
            if(found){
                found.count++;
            }else{
                allWords.push({word:child.word_2,count:1});
            }
            found = _.find(allWords,function(o) { return o.word == child.word_3; });
            if(found){
                found.count++;
            }else{
                allWords.push({word:child.word_3,count:1});
            }
        });
        //console.log(words);
        allWords = _.orderBy(allWords, ['count'],['desc']);
        allWords = _.slice(allWords,0,3);
        vis.nodeWords.push({id:parent.id,words:allWords[0].word+", "+allWords[1].word+", "+allWords[2].word,font_size:vis.nodeTextFontSize(allWords[0].count)});
    });

    // Option 3: Get the top 3 words for each node - Based on word score

    //console.log(vis.nodeWords);
}
