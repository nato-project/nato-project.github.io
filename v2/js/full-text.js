
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
    this.killed_wounded = [];

    this.initVis();
}

/*
 * Initialize area chart with brushing component
 */
FullText.prototype.initVis = function() {
    var vis = this; // read about the this

    vis.margin = {top: 10, right: 0, bottom: 10, left: 0};

    vis.width = 600 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .attr("class","vis-container")
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append("rect")
        .attr("x",0)
        .attr("y",0)
        .attr("width",(vis.width + vis.margin.left + vis.margin.right))
        .attr("height",(vis.height + vis.margin.top + vis.margin.bottom))
        .style("fill","#e9f0f5");

    vis.color = d3.scale.ordinal();
    vis.color.domain(["CACHE/FOUND","CRIME","CWIED","HOAX/FALSE","PROJECTED","RCIED","S-PBIED","TIME DELAY","UNKNOWN","VBIED","VOIED"]);
    vis.color.range([COMMON_COLORS["CACHE/FOUND"],COMMON_COLORS["CRIME"],COMMON_COLORS["CWIED"],COMMON_COLORS["HOAX/FALSE"],COMMON_COLORS["PROJECTED"],COMMON_COLORS["RCIED"],COMMON_COLORS["S-PBIED"],COMMON_COLORS["TIME DELAY"],COMMON_COLORS["UNKNOWN"],COMMON_COLORS["VBIED"],COMMON_COLORS["VOIED"]]);

    // Link width
    vis.linkWidth = d3.scale.linear();
    vis.linkWidth.domain([0.5,1]).range([2,9]);
    vis.linkDistance = d3.scale.linear();
    vis.linkDistance.domain([0.5,1]).range([40,10]);

    // Node Text Font Size
    vis.nodeTextFontSize = d3.scale.linear();
    vis.nodeTextFontSize.domain([1,600]).range([10,30]);

    vis.typeList = [];
    vis.texttimelinetitle = d3.select("#text-timeline-title");

    var node;
    vis.findNode = function(id){
        //return vis.nodes[id];
        return _.find(this.displayData, function(o) { return o.id == id; });
    }

    // Create nodes and links
    vis.iedData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
        if(vis.typeList.indexOf(d.type) == -1){
            vis.typeList.push(d.type);
        }
        // Add nodes only if we have a link
        //if((_.findIndex(vis.textLinkData,function(o){ return (o.s_id == d.id) || (o.t_id == d.id)}) > -1)){
        //    vis.nodes.push({name: d.id,id: d.id});
        //    if(vis.typeList.indexOf(d.type) == -1){
        //        vis.typeList.push(d.type);
        //    }
        //}
    });
    var src,tgt;
    vis.textLinkData.forEach(function(d) {
        src = _.findIndex(vis.nodes,function(o){ return o.id == d.s_id});
        tgt = _.findIndex(vis.nodes,function(o){ return o.id == d.t_id});
        if(src > -1 && tgt > -1) {
            vis.links.push({source: src, target: tgt, cs_value: d.cs_value});
            //vis.displayTextLinkData.push({s_id: d.s_id,t_id: d.t_id,cs_value: d.cs_value});
        }
        //vis.links.push({source: d.s_id-1,target: d.t_id-1,cs_value: d.cs_value});
    });
    console.log(vis.nodes);
    console.log(vis.links);
    console.log(vis.typeList);

    // 1) INITIALIZE FORCE-LAYOUT
    vis.force = d3.layout.force()
        .size([vis.width, vis.height])
        .linkDistance(function(d){
            //return vis.linkDistance(d.cs_value);
            return 30;
        })
        .gravity(.35)
        .charge(-30)

        //.friction(.8)
        //.linkDistance(30)
        //.charge(-200)
        //.gravity(.8);

    // 2a) DEFINE 'NODES' AND 'EDGES'
    vis.force.nodes(vis.nodes)
        .links(vis.links);

    vis.generateNodeWords();
    vis.generateKilledWounded();
    //console.log(vis.killed_wounded);

    // 2b) START RUNNING THE SIMULATION
    vis.force.start();

    // 3) DRAW THE LINKS (SVG LINE)
    vis.linkItems = vis.svg.append("g").selectAll(".force-layout-link")
        .data(vis.links)
        .enter()
        .append("line")
        .attr("class", "force-layout-link")
        .style("stroke", function(d) {
            return vis.color(vis.findNode(d.source.id).type);
        })
        .style("stroke-width", function(d) {
            return vis.linkWidth(d.cs_value);
        });

    // 4) DRAW THE NODES (SVG CIRCLE)
    vis.nodeItems = vis.svg.append("g").selectAll(".force-layout-node")
        .data(vis.nodes)
        .enter().append("circle")
        .attr("class", "force-layout-node")
        .attr("r", 2)
        .style("fill", function(d) { return vis.color(vis.findNode(d.id).type); })
        .style("stroke", function(d) { return vis.color(vis.findNode(d.id).type); })
        .on("click", function(d) {
            vis.nodeClick(d);
        });

    vis.nodeClickTextList = [];
    vis.nodeClick = function(d){
        vis.nodeClickTextList.unshift(vis.findNode(d.id));
        vis.texttimelinetitle.text("");
        vis.displayText(vis.nodeClickTextList);
    }

    // Casualty Icons
    vis.nodeCasualtyItems = vis.svg.append("g").selectAll(".force-layout-casualty")
        .data(vis.killed_wounded)
        .enter().append("svg:image")
        .attr("width",13)
        .attr("height",13)
        .attr('xlink:href',function(d){
            if(d.kia >0){
                return "img/person-killed.svg";
            }else{
                return "img/person-wounded.svg";
            }
        })
        .on("click", function(d) {
            vis.nodeCasualtyClick(d);
        });

    vis.nodeCasualtyClick = function(d){
        vis.nodeClickTextList.unshift(vis.findNode(d.id));
        vis.texttimelinetitle.text("");
        vis.displayText(vis.nodeClickTextList);
    }

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
        .text(function(d) { return d.words; })
        .on("click", function(d) {
            vis.nodeTextClick(d);
        });

    vis.nodeTextClick = function(d){
        console.dir(d);
        // Find all children for node word
        var relatedNodes = _.filter(vis.displayTextLinkData, function(o) { return o.s_id== d.id; });
        var nodes = [];
        nodes.push(vis.findNode(d.id));
        relatedNodes.forEach(function(o){
            nodes.unshift(vis.findNode(o.t_id));
        });
        vis.texttimelinetitle.text(d.words);
        vis.displayText(nodes, d.words);
    }



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

        // Update casualty icons
        vis.nodeCasualtyItems.attr("x",function(d) {
            var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
            if(node){
                return node.x-5;
            }else{
                return 2000;
            }

        }).attr("y", function(d) {
            var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
            if(node){
                return node.y-5;
            }else{
                return 2000;
            }
        });

        // Update Node Text
        vis.nodeTextItems.attr("x", function(d) {
                var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
                if(node){
                    return node.x-50;
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
        .data(vis.typeList)
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; })
        .style("cursor","pointer");
    vis.legendbox = vis.legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d){return vis.color(d);})
        .on("click", function(d) {
            vis.legendClick(d);
        });
    vis.legendlabels = vis.legend.append("text")
        .attr("class", "force-layout-legend-labels")
        .attr("x", 20)
        .attr("y", 10)
        .style("fill", function(d){
            //return d;
            return "#000000";
        })
        .text(function(d){
            return d;
        })
        .style("font-size",8)
        .on("click", function(d) {
            vis.legendClick(d);
        });

    vis.legendClick = function(d){
        //console.log(d);
        var allNodes = _.filter(vis.displayData, function(o) { return o.type==d; });
        //console.log(allNodes.length);
        var nodes =[];
        allNodes.forEach(function(d){
            if(_.findIndex(vis.nodes,function(o){return d.id== o.id;}) > -1){
                nodes.push(d);
            }
        });
        //console.log(nodes.length);
        vis.texttimelinetitle.text(d);
        vis.displayText(nodes);
    }

    // Casualty Legend
    vis.casualtyLegend = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.width - 70) + "," + (10) + ")")
        .selectAll("g")
        .data(["Killed","Wounded"])
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; })
        .style("cursor","pointer");

    //vis.casualtyLegendRect = vis.casualtyLegend.append("rect")

    vis.casualtyLegendIcon = vis.casualtyLegend.append("svg:image")
        .attr("width",13)
        .attr("height",13)
        .attr('xlink:href',function(d,i){
            if(i==0){
                return "img/person-killed.svg";
            }else{
                return "img/person-wounded.svg";
            }
        })
        .on("click", function(d) {
            vis.casualtyLegendClick(d);
        });
    vis.casualtyLegendLabels = vis.casualtyLegend.append("text")
        .attr("class", "force-layout-casualtylegend-labels")
        .attr("x", 15)
        .attr("y", 10)
        .style("fill", "#000000")
        .text(function(d){
            return d;
        })
        .style("font-size",8)
        .on("click", function(d) {
            vis.casualtyLegendClick(d);
        });

    vis.casualtyLegendClick = function(d){
        //console.log(d);
        var allNodes = [];
        if(d=="Killed"){
            allNodes = _.filter(vis.displayData, function(o) { return o.kia > 0; });
        }else{
            allNodes = _.filter(vis.displayData, function(o) { return o.wia > 0; });
        }

        //console.log(allNodes.length);
        var nodes =[];
        allNodes.forEach(function(d){
            if(_.findIndex(vis.nodes,function(o){return d.id== o.id;}) > -1){
                nodes.push(d);
            }
        });
        //console.log(nodes.length);
        vis.texttimelinetitle.text(d);
        vis.displayText(nodes);
    }


    vis.textTimeline = d3.select("#text-timeline");
    vis.textTimeline1 = d3.select("#text-timeline1");
    vis.textTimeline2 = d3.select("#text-timeline2");
    vis.textTimeline3 = d3.select("#text-timeline3");

    // Tool Tip
    //var node;
    //vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    //    node = vis.findNode(d.id);
    //    var tipContent = "";
    //    tipContent += "<div class='tooltip-content text-center'>" + node.text + "</div>";
    //    tipContent += "<div class='tooltip-content text-center'>Region: " + node.region + " / City: "+node.city+"</div>";
    //    tipContent += "<div class='tooltip-content text-center'>Killed: " + node.kia + " / Wounded: "+node.wia+"</div>";
    //
    //    return tipContent;
    //});

    // Invoke tooltip
    //vis.nodeItems.on('mouseover', vis.tip.show)
    //    .on('mouseout', vis.tip.hide);
    //vis.nodeItems.call(vis.tip);

    // Wrangle and update
    //vis.wrangleData();

    // Simulate a node word click
    setTimeout(function() { vis.nodeTextClick({id:24,words:"station, metro, central"}); }, 3000);

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
    vis.typeList = [];
    vis.displayTextLinkData = [];
    vis.textLinkData.forEach(function(d) {
        if (d.cs_value >= (vis.threshold / 100)) {
            vis.displayTextLinkData.push(d);
        }
    });
    vis.displayData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
        if(vis.typeList.indexOf(d.type) == -1){
            vis.typeList.push(d.type);
        }
        //// Add nodes only if we have a link
        //if((_.findIndex(vis.displayTextLinkData,function(o){ return (o.s_id == d.id) || (o.t_id == d.id)}) > -1)){
        //    vis.nodes.push({name: d.id,id: d.id});
        //    if(vis.typeList.indexOf(d.type) == -1){
        //        vis.typeList.push(d.type);
        //    }
        //}
    });
    var src,tgt;
    vis.links = [];

    vis.displayTextLinkData.forEach(function(d) {
        src = _.findIndex(vis.nodes,function(o){ return o.id == d.s_id});
        tgt = _.findIndex(vis.nodes,function(o){ return o.id == d.t_id});
        //console.log(src + " / "+ tgt);
        if(src > -1 && tgt > -1) {
            vis.links.push({source: src, target: tgt, cs_value: d.cs_value});
        }
    });

    vis.generateNodeWords();
    vis.generateKilledWounded();

    // Update the visualization
    vis.updateVis();

}

FullText.prototype.updateVis = function() {

    var vis = this; // read about the this
    var node;

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
            node = vis.findNode(d.source.id);
            if(vis.displaytype == "incidenttype") {
                return vis.color(node.type);
            }else{
                if(node.kia >0){
                    return vis.color("Killed");
                }else if(node.wia >0){
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
            node = vis.findNode(d.id);
            if(vis.displaytype == "incidenttype") {
                return vis.color(node.type);
            }else{
                if(node.kia >0){
                    return vis.color("Killed");
                }else if(node.wia >0){
                    return vis.color("Wounded");
                }else{
                    return vis.color("No Casualities");
                }
            }
        })
        .style("stroke", function(d) {
            node = vis.findNode(d.id);
            if(vis.displaytype == "incidenttype") {
                return vis.color(node.type);
            }else{
                if(node.kia >0){
                    return vis.color("Killed");
                }else if(node.wia >0){
                    return vis.color("Wounded");
                }else{
                    return vis.color("No Casualities");
                }
            }
        })
        .on("click", function(d) {
            vis.nodeClick(d);
        });

    // Update Casualty Icon
    vis.nodeCasualtyItems = vis.nodeCasualtyItems.data(vis.killed_wounded);
    vis.nodeCasualtyItems.exit().remove();
    vis.nodeCasualtyItems.enter()
        .append("svg:image")
        .attr("width",13)
        .attr("height",13)
        .attr('xlink:href',function(d){
            if(d.kia >0){
                return "img/person-killed.svg";
            }else{
                return "img/person-wounded.svg";
            }
        })
        .on("click", function(d) {
            vis.nodeCasualtyClick(d);
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
        .text(function(d) { return d.words; })
        .on("click", function(d) {
            vis.nodeTextClick(d);
        });



    // Legend
    vis.legend = vis.legend.data(vis.typeList);
    vis.legend.exit().remove();
    vis.legend.enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });
    vis.legendbox.remove();
    vis.legendbox = vis.legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d){return vis.color(d);});
    vis.legendlabels.remove();
    vis.legendlabels = vis.legend.append("text")
        .attr("class", "force-layout-legend-labels")
        .attr("x", 20)
        .attr("y", 10)
        .style("fill", function(d){
            //return d;
            return "#000000";
        })
        .text(function(d){
            return d;
        })
        .style("font-size",8)
        .on("click", function(d) {
            vis.legendClick(d);
        });

    // Invoke tooltip
    //vis.nodeItems.on('mouseover', vis.tip.show)
    //    .on('mouseout', vis.tip.hide);
    //vis.nodeItems.call(vis.tip);

}

FullText.prototype.displayText = function(nodes,words){
    var vis = this;

    console.log(nodes);

    vis.textTimeline.selectAll("div").remove();
    vis.textTimeline1.selectAll("div").remove();
    vis.textTimeline2.selectAll("div").remove();
    vis.textTimeline3.selectAll("div").remove();

    var nodes1 =[];
    var nodes2 =[];
    var nodes3 =[];
    if(nodes.length > 5){
        var extraItems = nodes.length-5;
        for(var i=5;i<nodes.length;i++){
            nodes1.push(nodes[i]);
            if(i+1 < nodes.length) {
                nodes2.push(nodes[i]);
                i++;
            }
            if(i+1 < nodes.length) {
                nodes3.push(nodes[i]);
                i++;
            }
        }
        nodes = _.slice(nodes,0,5);
    }

    displayTextOnSection(vis.textTimeline,nodes,words);
    if(nodes1.length >0){
        displayTextOnSection(vis.textTimeline1,nodes1,words);
    }
    if(nodes2.length >0){
        displayTextOnSection(vis.textTimeline2,nodes2,words);
    }
    if(nodes3.length >0){
        displayTextOnSection(vis.textTimeline3,nodes3,words);
    }


    function displayTextOnSection(textTimeline,nodes,words){
        var wordList = [];
        if(words){
            wordList = words.split(', ');
        }
        var textTimelineBlock = textTimeline.selectAll("div")
            .data(nodes)
            .enter()
            .append("div")
            .attr("class","cd-timeline-block");

        var textTimelineBlockImg = textTimelineBlock.append("div")
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

        var textTimelineBlockContent = textTimelineBlock.append("div").attr("class","cd-timeline-content");
        textTimelineBlockContent.append("h2").text(function(d){
            return vis.dateFormat(d.date);
        });
        textTimelineBlockContent.append("p").html(function(d){
            var text = d.text;
            wordList.forEach(function(d){
                //text = text.replace(/d/gi, "<span class='important-word'>"+d+"</span>");
                text = _.replace(text, new RegExp(d, "gi"), "<span class='important-word'>"+d+"</span>")
            });

            return text;
        });
        textTimelineBlockContent.append("span")
            .attr("class","cd-date")
            .text(function(d){
                return d.kia+" killed, "+ d.wia+" wounded in "+ d.city+", "+ d.region;
            });
    }

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

FullText.prototype.generateKilledWounded = function () {
    var vis = this;

    vis.killed_wounded = [];
    var node;
    vis.nodes.forEach(function(d) {
        node = vis.findNode(d.id);
        if(node.kia > 0 || node.wia >0){
            vis.killed_wounded.push(node);
        }
    });
}

