
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

    vis.width = 745 - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .attr("class","img-responsive")
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
    vis.nodeTextFontSize.domain([1,300]).range([10,25]);


    vis.texttimelinetitle = d3.select("#text-timeline-title");

    vis.findNode = function(id){
        //return vis.nodes[id];
        return _.find(this.displayData, function(o) { return o.id == id; });
    }

    // Create nodes and links
    vis.displayData.forEach(function(d) {
        //if(d.id ==24){
        //    vis.nodes.push({name: d.id,id: d.id,x:365, y:90, fixed:true});
        //}else{
            vis.nodes.push({name: d.id,id: d.id});
        //}

        //if(vis.typeList.indexOf(d.type) == -1){
        //    vis.typeList.push(d.type);
        //}

        // Add nodes only if we have a link
        //if((_.findIndex(vis.textLinkData,function(o){ return (o.s_id == d.id) || (o.t_id == d.id)}) > -1)){
        //    vis.nodes.push({name: d.id,id: d.id});
        //    if(vis.typeList.indexOf(d.type) == -1){
        //        vis.typeList.push(d.type);
        //    }
        //}
    });

    vis.getTypeList = function(){
        vis.typeList = [];
        var uniqTypes = _.uniqBy(vis.displayData, 'type');
        uniqTypes.forEach(function(d) {
            vis.typeList.push({type:d.type});
        });
        vis.typeList = _.orderBy(vis.typeList, ['type']);
    }
    vis.getTypeList();


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
    //console.log(vis.nodes);
    //console.log(vis.links);
    console.log(vis.typeList);

    vis.generateNodeWords();

    // Assign x,y to node word nodes
    //console.log(vis.nodeWords);
    vis.nodewordPositions = [[320,60],[360,420],[220,100],[260,390],[480,370],[420,120],[180,180],[330,150],[380,350],[520,200],[180,270],[350,300],[350,230],[350,200],[490,270]];

    vis.positionNodeWords =  function(fix){
        console.log(vis.nodeWords);
        if(vis.nodeWords.length <10){
            return;
        }
        vis.nodeWords.forEach(function(d,i){
            //console.log(d);
            var node = _.find(vis.nodes, function(o) { return o.id == d.id; });
            if(node){
                node.x = vis.nodewordPositions[i][0];
                node.y = vis.nodewordPositions[i][1];
                node.fixed = fix;
            }
        });
    }
    vis.positionNodeWords(true);

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
        console.log(d);
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

    // Node Text Bg Rectangle
    vis.nodeTextRectItems = vis.svg.append("g").selectAll(".force-layout-text-rect")
        .data(vis.nodeWords)
        .enter().append("rect")
        .attr("class", "force-layout-text-rect")
        .attr("id",function(d,i){
            return "nodeTextRectItems_"+i;
        })
        .style("fill", "none")
        .style("fill-opacity",0.7)
        .on("click", function(d) {
            vis.nodeTextClick(d);
        })
        .style("cursor","pointer");

    // Node Text
    vis.nodeTextItems = vis.svg.append("g").selectAll(".force-layout-text")
        .data(vis.nodeWords)
        .enter().append("text")
        .attr("class", "force-layout-text")
        .style("font-size", function(d) { return d.font_size; })
        .style("opacity", 0)
        .style("stroke", "#000000")
        .text(function(d) { return d.words; })
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#nodeTextRectItems_"+i).style("fill", "#FFFDC4");
            vis.nodeTextClick(d);
        })
        .on("mouseover",function(d,i){
            d3.select("#nodeTextRectItems_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#nodeTextRectItems_"+i).style("fill", "none");
            }
        });

    vis.nodeTextItems.transition().delay(2000).duration(1000)
        .style("cursor","pointer")
        .style("opacity", 1);

    // Set the width/height of the rect behind node word
    vis.nodeTextRectItems.attr("width",function(d,i){
        return vis.nodeTextItems[0][i].clientWidth;
    }).attr("height",function(d,i){
        return vis.nodeTextItems[0][i].clientHeight;
    });

    vis.nodeTextClick = function(d){
        // Find all children for node word
        var relatedNodes = _.filter(vis.displayTextLinkData, function(o) { return o.s_id== d.id; });
        var nodes = [];
        nodes.push(vis.findNode(d.id));
        relatedNodes.forEach(function(o){
            nodes.unshift(vis.findNode(o.t_id));
        });
        vis.texttimelinetitle.text("Top Words: "+d.words);
        vis.displayText(nodes, d.words);
    }



    // 5) Force TICK
    vis.force.on("tick", function(e) {

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
        vis.nodeTextRectItems.attr("x", function(d) {
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
                    return node.y- d.font_size;
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
        .attr("transform", function(d, i) { return "translate(0," + (i * 25) + ")"; })
        .style("cursor","pointer");

    vis.legendRect = vis.legend.append("rect")
        .attr("width",80)
        .attr("height",15)
        .attr("id",function(d,i){
            return "legendRect_"+i;
        })
        .style("fill", "none")
        .style("fill-opacity",0.7)
        .on("click", function(d) {
            vis.legendClick(d.type);
        })
        .style("cursor","pointer");

    vis.legendbox = vis.legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d){return vis.color(d.type);})
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
            vis.legendClick(d.type);
        })
        .on("mouseover",function(d,i){
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#legendRect_"+i).style("fill", "none");
            }
        });

    vis.NumberOfKilledWoundedByType = function(type){
        var killedWounded = [0,0];

        vis.displayData.forEach(function(d){
            if(d.type == type) {
                killedWounded[0] += d.kia;
                killedWounded[1] += d.wia;
            }
        });

        return killedWounded;
    }

    vis.legendlabels = vis.legend.append("text")
        .attr("class", "force-layout-legend-labels")
        .attr("x", 20)
        .attr("y", 10)
        .style("fill", function(d){
            //return d;
            return "#000000";
        })
        .text(function(d){
            return d.type;
        })
        .style("font-size",8)
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
            vis.legendClick(d.type);
        })
        .on("mouseover",function(d,i){
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#legendRect_"+i).style("fill", "none");
            }
        });
    vis.legendlabelsTspan = vis.legendlabels.append("tspan").attr("x", 18).attr("y", 18).style("font-size",7);

    vis.legendlabelsTspan.text(function(d){
        var kw = vis.NumberOfKilledWoundedByType(d.type);
        var text = "";
        if(kw[0] > 0){
            text += " Killed: "+kw[0];

        }
        if(kw[1] > 0){
            text += " Wounded: "+kw[1];
        }
        return text;
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
        vis.texttimelinetitle.text("IED Type: "+d);
        vis.displayText(nodes);
    }



    // Casualty Legend
    vis.casualtyLegend = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.width - 90) + "," + (10) + ")")
        .selectAll("g")
        .data([{name:"Killed"},{name:"Wounded"}])
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; })
        .style("cursor","pointer");

    vis.casualtyLegendRect = vis.casualtyLegend.append("rect")
        .attr("width",55)
        .attr("height",15)
        .style("fill", "none")
        .style("fill-opacity",0.7)
        .attr("id",function(d,i){
            return "casualtyLegendRect_"+i;
        })
        .on("click", function(d) {
            vis.casualtyLegendClick(d.name);
        })
        .style("cursor","pointer");

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
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#casualtyLegendRect_"+i).style("fill", "#FFFDC4");
            vis.casualtyLegendClick(d.name);
        })
        .on("mouseover",function(d,i){
            d3.select("#casualtyLegendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#casualtyLegendRect_"+i).style("fill", "none");
            }
        });
    vis.casualtyLegendLabels = vis.casualtyLegend.append("text")
        .attr("class", "force-layout-casualtylegend-labels")
        .attr("x", 15)
        .attr("y", 10)
        .style("fill", "#000000")
        .text(function(d){
            return d.name;
        })
        .style("font-size",8)
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#casualtyLegendRect_"+i).style("fill", "#FFFDC4");
            vis.casualtyLegendClick(d.name);
        })
        .on("mouseover",function(d,i){
            d3.select("#casualtyLegendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#casualtyLegendRect_"+i).style("fill", "none");
            }
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
        vis.texttimelinetitle.text("Casualty Outcome: "+d);
        vis.displayText(nodes);
    }

    vis.unSelectAllLegends = function(){

        // Casuality Legend
        vis.casualtyLegendRect.style("fill", function(d){
            d.clicked = false;
            return "none";
        });
        // Types Legend
        vis.legendRect.style("fill", function(d){
            d.clicked = false;
            return "none";
        });
        // Node Words
        vis.nodeTextRectItems.style("fill", function(d){
            d.clicked = false;
            return "none";
        });
    }

    vis.textTimeline = d3.select("#text-timeline");
    vis.textTimeline1 = d3.select("#text-timeline1");
    vis.textTimeline2 = d3.select("#text-timeline2");
    vis.textTimeline3 = d3.select("#text-timeline3");

    // Simulate a node word click
    setTimeout(function() {
        vis.nodeTextClick({id:24,words:"station, metro, central"});
        d3.select("#nodeTextRectItems_0").style("fill", "#FFFDC4");
    }, 2000);

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
    vis.displayTextLinkData = [];
    var filteredDisplayTextLinkData = [];
    vis.textLinkData.forEach(function(d) {
        if (d.cs_value >= (vis.threshold / 100)) {
            filteredDisplayTextLinkData.push(d);
        }
    });

    vis.displayData.forEach(function(d) {
        vis.nodes.push({name: d.id,id: d.id});
        //if(vis.typeList.indexOf(d.type) == -1){
        //    vis.typeList.push(d.type);
        //}
        //// Add nodes only if we have a link
        //if((_.findIndex(vis.displayTextLinkData,function(o){ return (o.s_id == d.id) || (o.t_id == d.id)}) > -1)){
        //    vis.nodes.push({name: d.id,id: d.id});
        //    if(vis.typeList.indexOf(d.type) == -1){
        //        vis.typeList.push(d.type);
        //    }
        //}
    });
    vis.getTypeList();

    var src,tgt;
    vis.links = [];

    filteredDisplayTextLinkData.forEach(function(d) {
        src = _.findIndex(vis.nodes,function(o){ return o.id == d.s_id});
        tgt = _.findIndex(vis.nodes,function(o){ return o.id == d.t_id});
        //console.log(src + " / "+ tgt);
        if(src > -1 && tgt > -1) {
            vis.links.push({source: src, target: tgt, cs_value: d.cs_value});
            vis.displayTextLinkData.push(d);
        }
    });
    console.log(vis.displayTextLinkData);

    console.log("Node count: "+vis.nodes.length);
    console.log("Links count: "+vis.links.length);
    console.log("displayTextLinkData count: "+vis.displayTextLinkData.length);

    vis.generateNodeWords();
    vis.generateKilledWounded();

    // Update the visualization
    vis.updateVis();

}

FullText.prototype.updateVis = function() {

    var vis = this; // read about the this
    var node;

    vis.force.stop();

    vis.unSelectAllLegends();

    vis.positionNodeWords(true);

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

    // Update Text Rectangles
    vis.nodeTextRectItems = vis.nodeTextRectItems.data(vis.nodeWords);
    vis.nodeTextRectItems.exit().remove();
    vis.nodeTextRectItems.enter()
        .append("rect")
        .attr("class", "force-layout-text-rect")
        .attr("id",function(d,i){
            return "nodeTextRectItems_"+i;
        })
        .style("fill", "none")
        .style("fill-opacity",0.7)
        .on("click", function(d) {
            vis.nodeTextClick(d);
        })
        .style("cursor","pointer");

    // Update Text
    vis.nodeTextItems = vis.nodeTextItems.data(vis.nodeWords);
    vis.nodeTextItems.exit().remove();
    vis.nodeTextItems.enter()
        .append("text")
        .attr("class", "force-layout-text")
        .text(function(d) { return d.words; });

    vis.nodeTextItems.style("font-size", function(d) { return d.font_size; })
        .style("opacity", 0)
        .style("stroke", "#000000")
        .text(function(d) { return d.words; })
        .style("cursor","pointer")
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#nodeTextRectItems_"+i).style("fill", "#FFFDC4");
            vis.nodeTextClick(d);
        })
        .on("mouseover",function(d,i){
            d3.select("#nodeTextRectItems_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#nodeTextRectItems_"+i).style("fill", "none");
            }
        });
    vis.nodeTextItems.transition().delay(2000).duration(1000)
        .style("cursor","pointer")
        .style("opacity", 1);

    // Set the width/height of the rect behind node word
    vis.nodeTextRectItems.attr("width",function(d,i){
        return vis.nodeTextItems[0][i].clientWidth;
    }).attr("height",function(d,i){
        return vis.nodeTextItems[0][i].clientHeight;
    });

    // Legend
    vis.legend = vis.legend.data(vis.typeList);
    vis.legend.exit().remove();
    vis.legend.enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });

    vis.legendRect.remove();
    vis.legendRect = vis.legend.append("rect")
        .attr("width",80)
        .attr("height",15)
        .attr("id",function(d,i){
            return "legendRect_"+i;
        })
        .style("fill", "none")
        .style("fill-opacity",0.7)
        .on("click", function(d) {
            vis.legendClick(d.type);
        })
        .style("cursor","pointer");

    vis.legendbox.remove();
    vis.legendbox = vis.legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d){return vis.color(d.type);})
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
            vis.legendClick(d.type);
        })
        .on("mouseover",function(d,i){
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#legendRect_"+i).style("fill", "none");
            }
        });

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
            return d.type;
        })
        .style("font-size",8)
        .on("click", function(d,i) {
            vis.unSelectAllLegends();
            d.clicked = true;
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
            vis.legendClick(d.type);
        })
        .on("mouseover",function(d,i){
            d3.select("#legendRect_"+i).style("fill", "#FFFDC4");
        })
        .on("mouseout",function(d,i){
            //console.log(d);
            if(!d.clicked){
                d3.select("#legendRect_"+i).style("fill", "none");
            }
        });
    vis.legendlabelsTspan = vis.legendlabels.append("tspan").attr("x", 18).attr("y", 18).style("font-size",7);

    vis.legendlabelsTspan.text(function(d){
        var kw = vis.NumberOfKilledWoundedByType(d.type);
        var text = "";
        if(kw[0] > 0){
            text += " Killed: "+kw[0];

        }
        if(kw[1] > 0){
            text += " Wounded: "+kw[1];
        }
        return text;
    });

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
    if(nodes.length > 4){
        var extraItems = nodes.length-4;
        for(var i=4;i<nodes.length;i++){
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
        nodes = _.slice(nodes,0,4);
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
        //console.log(allWords);
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

