var units = "IED Incidents";
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },

    //funtion to return IED Type tooltip description
    formatIEDTypesTip = function(d) {

        if (IED_TYPE_DESC[d.name]) {
            return d.name +
                "\nDesc: " + IED_TYPE_DESC[d.name] +
                "\nTotal: " + format(d.value);
        }
        else {
            return d.name +
                "\nTotal: " + format(d.value);
        }


    }



SankeyVis = function(_parentElement, _iedData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;

    this.displayData = []; // see data wrangling
    this.iedDetailDisplayData = [];

    this.filter = [];
    this.tableFilter;
    this.sankeySelection;
    this.displayColumns = ["dateFmt", "city", "kia", "wia", "type"];
    this.sankeyChanged;

    this.dateFormat = d3.time.format("%b %d %Y");

    this.initVis();

}

/*
 * Initialize area chart with brushing component
 */
SankeyVis.prototype.initVis = function() {
    var vis = this; // read about the this

    vis.margin = {top: 10, right: 0, bottom: 10, left: 0};

    vis.width = 600 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    //Initialize color schema
    vis.color = d3.scale.ordinal();
    vis.color.domain(["CACHE/FOUND","CRIME","CWIED","HOAX/FALSE","PROJECTED","RCIED","S-PBIED","TIME DELAY","UNKNOWN","VBIED","VOIED","No Casualties", "Killed", "Wounded", "Incidents","Causing Deaths", "Causing Injuries"]);
    vis.color.range([COMMON_COLORS["CACHE/FOUND"],COMMON_COLORS["CRIME"],COMMON_COLORS["CWIED"],COMMON_COLORS["HOAX/FALSE"],COMMON_COLORS["PROJECTED"],COMMON_COLORS["RCIED"],COMMON_COLORS["S-PBIED"],COMMON_COLORS["TIME DELAY"],COMMON_COLORS["UNKNOWN"],COMMON_COLORS["VBIED"],COMMON_COLORS["VOIED"], COMMON_COLORS["NO_CASUALITY"],COMMON_COLORS["KILLED"],COMMON_COLORS["WOUNDED"],COMMON_COLORS["INCIDENT"],COMMON_COLORS["KILLED"],COMMON_COLORS["WOUNDED"]]);


    //Initialize global variables
    vis.tableFilter = new Object();
    vis.tableFilter.type = "N/A";
    vis.tableFilter.outcome = "N/A";
    vis.tableFilter.region = "N/A";
    vis.sankeyChanged = 1;
    vis.sankeySelection = "byType";

    width = 550 - vis.margin.left - vis.margin.right,

    // SVG drawing area
    vis.svg = d3.select("#sankeyVis").append("svg")
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform",
            "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // Set the sankey diagram properties
    vis.sankey = d3.sankey()
        .nodeWidth(18)
        .nodePadding(30)
        .size([vis.width, vis.height]);

    vis.path =  vis.sankey.link();

    //IED detail table - replaced
/*
    vis.table = d3.select("#incidentTable").append("table")
        vis.thead = vis.table.append("thead"),
        vis.tbody = vis.table.append("tbody");

    // append the header row
    vis.thead.append("tr")
        .selectAll("th")
        .data(vis.displayColumns)
        .enter()
        .append("th")
        .text(function(column) {
              switch(column) {
                  case "dateFmt":
                      return "Date";
                  case "city":
                      return "City";
                  case "wia":
                      return "Wounded";
                  case "kia":
                      return "Killed";
                  case "type":
                      return "Type";
              }

        });

    // create a row for each object in the data
    rows = vis.tbody.selectAll("tr")
        .data(vis.iedDetailDisplayData, function(d) { return d.id;})
        .enter()
        .append("tr");

    // create a cell in each row for each column
    cells = rows.selectAll("td")
        .data(function(row) {
            return vis.displayColumns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        // .attr("style", "font-family: 'Roboto', sans-serif") // sets the font style
        .html(function(d) {return d.value;});
*/

    vis.texttimelinetitle = d3.select("#text-timeline-title");
    vis.texttimelinetitle.text("");

    vis.texttimelineiedtype = d3.select("#text-timeline-ied-type");
    vis.texttimelineiedtype.text("");

    vis.textTimeline = d3.select("#text-timeline");
    vis.textTimeline1 = d3.select("#text-timeline1");
    vis.textTimeline2 = d3.select("#text-timeline2");
    vis.textTimeline3 = d3.select("#text-timeline3");

    // initialize default selection
    vis.tableFilter.type = "PROJECTED";
    vis.tableFilter.outcome = "Wounded";

    vis.texttimelinetitle.text("PROJECTED → Wounded");
    vis.texttimelineiedtype.text("(PROJECTED: " + IED_TYPE_DESC["PROJECTED"] + ")");

    // Wrangle and update
    vis.wrangleData();

}

SankeyVis.prototype.wrangleData = function() {

    var vis = this; // read about the this

    vis.iedDetailDisplayData = iedData;
    vis.displayData = vis.iedData;

    // Filter with timeline
    if (vis.filter.length > 0) {
        vis.iedDetailDisplayData = vis.iedData.filter(function (d) {
            var first = new Date(d.date) >= vis.filter[0];
            var second = new Date(d.date) <= vis.filter[1];
            var third = vis.tableFilter.type == d.type;
            var forth = vis.tableFilter.outcome == d.outcome;
            return first && second;
        });

        vis.displayData= vis.iedData.filter(function (d) {
            var first = new Date(d.date) >= vis.filter[0];
            var second = new Date(d.date) <= vis.filter[1];
            return first && second;
        });
    }

    //Filter IED table based on the sankey mouseover
    if (vis.sankeySelection == "byType") {
        vis.iedDetailDisplayData = vis.iedDetailDisplayData.filter(function (d) {

            var third = (vis.tableFilter.type == d.type) || vis.tableFilter.type == "N/A";
            var fourth = ( vis.tableFilter.outcome == "Wounded" & d.wia > 0 )
                || ( vis.tableFilter.outcome == "Killed" & d.kia > 0 )
                || vis.tableFilter.outcome == "N/A";
            return third & fourth;
        });
    }
    if (vis.sankeySelection == "byTypeAndOutcome") {
        vis.iedDetailDisplayData = vis.iedDetailDisplayData.filter(function (d) {
            var third = (   vis.tableFilter.outcome == "N/A"
                            || ( vis.tableFilter.outcome == "Killed" & d.kia > 0
                                || vis.tableFilter.outcome == "Wounded" & d.kia == 0 & d.wia > 0
                                || vis.tableFilter.outcome == "Unknown" & d.kia == 0 & d.wia == 0
                )
                        );
            var fourth =  vis.tableFilter.type == "N/A" || vis.tableFilter.type == d.type;

            var fifth = (  vis.tableFilter.type == "N/A"
                            ||  ( vis.tableFilter.outcome == "Filled" & d.kia > 0
                                    ||  vis.tableFilter.outcome == "Wounded" & d.kia == 0 & d.wia > 0
                                    ||  vis.tableFilter.outcome == "Unknown" & d.kia == 0 & d.wia == 0
                                    || vis.tableFilter.outcome == "N/A")
                        );


            return third & fourth;
        });
    }
    if (vis.sankeySelection == "byRegion") {

        vis.iedDetailDisplayData = vis.iedDetailDisplayData.filter(function (d) {

            var third = (vis.tableFilter.region == d.region) || vis.tableFilter.region == "N/A";
            var fourth = ( vis.tableFilter.outcome == "Wounded" & d.wia > 0 )
                || ( vis.tableFilter.outcome == "Killed" & d.kia > 0 )
                || vis.tableFilter.outcome == "N/A";
            return third & fourth;
            return third & fourth;
        });
    }

    vis.nodes = [];
    vis.edges = [];
    var destinationNodesArray = [];
    var newNode;

    if (vis.sankeySelection == "byType") {

        units = "Casualties";
        //add main nodes
        for (var i = 0; i < vis.displayData.length; i++) {
            if (destinationNodesArray.indexOf(vis.displayData[i].type) < 0
                & (vis.displayData[i].kia > 0 || vis.displayData[i].wia > 0 )) {
                newNode = new Object()
                newNode.node = vis.nodes.length;
                newNode.name = vis.displayData[i].type;
                vis.nodes.push(newNode);
                destinationNodesArray[destinationNodesArray.length] = vis.displayData[i].type;
            }
        }
        //add destination nodes
        destinationNodesArray[destinationNodesArray.length] = 'Wounded';
        destinationNodesArray[destinationNodesArray.length] = 'Killed';

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Wounded";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Killed";
        vis.nodes.push(newNode);

        var newEdge;
        var existingEdge = -1;
        //add edges
        for (var i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].kia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Killed')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + vis.displayData[i].kia;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].type);
                    newEdge.target = destinationNodesArray.indexOf('Killed');
                    newEdge.value = vis.displayData[i].kia;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Killed';

                    vis.edges.push(newEdge);
                }
            }

            if (vis.displayData[i].wia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Wounded')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + vis.displayData[i].wia;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].type);
                    newEdge.target = destinationNodesArray.indexOf('Wounded');
                    newEdge.value = vis.displayData[i].wia;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Wounded';

                    vis.edges.push(newEdge);
                }
            }
        }
        ;
    }
    if (vis.sankeySelection == "byTypeAndOutcome"){

        units = "Incidents";

        //add main nodes
        for (var i = 0; i < vis.displayData.length; i++) {
            if (destinationNodesArray.indexOf(vis.displayData[i].type) < 0) {
                newNode = new Object()
                newNode.node = vis.nodes.length;
                newNode.name = vis.displayData[i].type;
                vis.nodes.push(newNode);
                destinationNodesArray[destinationNodesArray.length] = vis.displayData[i].type;
            }
        }
        //add destination nodes
        destinationNodesArray[destinationNodesArray.length] = 'Causing Deaths';
        destinationNodesArray[destinationNodesArray.length] = 'Causing Injuries';
        destinationNodesArray[destinationNodesArray.length] = 'No Casualties';
        destinationNodesArray[destinationNodesArray.length] = 'Incidents';

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Causing Deaths";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Causing Injuries";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "No Casualties";
        vis.nodes.push(newNode);


        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Incidents";
        vis.nodes.push(newNode);


        var newEdge;
        var existingEdge = -1;
        var killed = 0, wounded = 0, unknown = 0;

        //add edges
        for (var i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].kia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Causing Deaths')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + 1;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].type);
                    newEdge.target = destinationNodesArray.indexOf('Causing Deaths');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Killed';

                    vis.edges.push(newEdge);
                }
                killed++;
            }

            if (vis.displayData[i].wia > 0 && vis.displayData[i].kia == 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Causing Injuries')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + 1;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].type);
                    newEdge.target = destinationNodesArray.indexOf('Causing Injuries');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Wounded';

                    vis.edges.push(newEdge);
                }
                wounded++;
            }

            if (vis.displayData[i].wia == 0 && vis.displayData[i].kia == 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('No Casualties')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + 1;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].type);
                    newEdge.target = destinationNodesArray.indexOf('No Casualties');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Unknown';

                    vis.edges.push(newEdge);
                }
                unknown++;
            }
        };

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("Causing Deaths");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = killed;
        newEdge.type = "N/A";
        newEdge.outcome = "Killed";
        vis.edges.push(newEdge);

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("Causing Injuries");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = wounded;
        newEdge.type = "N/A";
        newEdge.outcome = "Wounded";
        vis.edges.push(newEdge);

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("No Casualties");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = unknown;
        newEdge.type = "N/A";
        newEdge.outcome = "Unknown";
        vis.edges.push(newEdge);

    }

    if (vis.sankeySelection == "byRegion") {

        units = "Casualties";
        //add main nodes
        for (var i = 0; i < vis.displayData.length; i++) {
            if (destinationNodesArray.indexOf(vis.displayData[i].region) < 0
                & (vis.displayData[i].kia > 0 || vis.displayData[i].wia > 0 )) {
                newNode = new Object()
                newNode.node = vis.nodes.length;
                newNode.name = vis.displayData[i].region;
                vis.nodes.push(newNode);
                destinationNodesArray[destinationNodesArray.length] = vis.displayData[i].region;
            }
        }
        //add destination nodes
        destinationNodesArray[destinationNodesArray.length] = 'Wounded';
        destinationNodesArray[destinationNodesArray.length] = 'Killed';

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Wounded";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Killed";
        vis.nodes.push(newNode);

        var newEdge;
        var existingEdge = -1;
        //add edges
        for (var i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].kia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].region)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Killed')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + vis.displayData[i].kia;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].region);
                    newEdge.target = destinationNodesArray.indexOf('Killed');
                    newEdge.value = vis.displayData[i].kia;
                    newEdge.region = vis.displayData[i].region;
                    newEdge.outcome = 'Killed';

                    vis.edges.push(newEdge);
                }
            }

            if (vis.displayData[i].wia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].region)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Wounded')) {
                        existingEdge = j;
                    }
                }

                if (existingEdge > -1) {
                    vis.edges[existingEdge].value = vis.edges[existingEdge].value + vis.displayData[i].wia;
                }
                else {
                    //create new edge
                    newEdge = new Object();
                    newEdge.source = destinationNodesArray.indexOf(vis.displayData[i].region);
                    newEdge.target = destinationNodesArray.indexOf('Wounded');
                    newEdge.value = vis.displayData[i].wia;
                    newEdge.region = vis.displayData[i].region;
                    newEdge.outcome = 'Wounded';

                    vis.edges.push(newEdge);
                }
            }
        }
        ;
    }

    // Update the visualization
    vis.updateVis();

}

SankeyVis.prototype.updateVis = function() {

    var vis = this; // read about the this

    if (vis.sankeyChanged == 1) {

        //remove previous sankey nodes and links
        var link = vis.svg.selectAll(".link");
        link.remove();

        var node = vis.svg.selectAll(".node");
        node.remove();

        vis.sankey
            .nodes(vis.nodes)
            .links(vis.edges)
            .layout(32);

        // add in the links
        link = vis.svg.append("g").selectAll(".link")
            .data(vis.edges);

        link
            .enter().append("path")
            .attr("class", "link")
            .attr("d", vis.path)
            .style("stroke-width", function (d) {
                return Math.max(1, d.dy);
            })
            .sort(function (a, b) {
               return b.dy - a.dy;
            })
            .on("mouseover", function (d) {

                vis.tableFilter.type = d.type;
                vis.tableFilter.region = d.region;
                vis.tableFilter.outcome = d.outcome;

                vis.texttimelinetitle.text(d.source.name + " → " + d.target.name);

                if (IED_TYPE_DESC[d.source.name]) {
                    vis.texttimelineiedtype.text("(" + d.source.name + ": " + IED_TYPE_DESC[d.source.name] + ")");
                } else {
                    vis.texttimelineiedtype.text("");
                }

                vis.sankeyChanged = 0;
                vis.wrangleData();
            });


        // add the link titles
        link.append("title")
            .text(function (d) {
                return d.source.name + " → " +
                    d.target.name + "\n" + format(d.value);
            });

        // add in the nodes

        node = vis.svg.append("g").selectAll(".node")
            .data(vis.nodes);

        node
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove));

        // add the rectangles for the nodes
        node.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", vis.sankey.nodeWidth())
            .style("fill", function (d) {
                return d.color = vis.color(d.name);//vis.color(d.name.replace(/ .*/, ""));
            })
            .style("stroke", function (d) {
                return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function (d) {
                //return d.name + "\n" + format(d.value);
                return formatIEDTypesTip(d);
            });

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .attr("font-size", "12px")
            .text(function (d) {
                return d.name + " (" + formatNumber(d.value) + ")";
            })
            .filter(function (d) {
                return d.x < vis.width / 2;
            })
            .attr("x", 6 + vis.sankey.nodeWidth())
            .attr("text-anchor", "start");

        // the function for moving the nodes
        function dragmove(d) {
            d3.select(this).attr("transform",
                "translate(" + d.x + "," + (
                    d.y = Math.max(0, Math.min(vis.height - d.dy, d3.event.y))
                ) + ")");
            vis.sankey.relayout();
            link.attr("d", vis.path);
        }

        node
            .exit()
            .remove();

        link
            .exit()
            .remove();
    }

    //Old tabular way of displaying events - discontinued now.
    /*
    //update table
    // create a row for each object in the data
    var rows = vis.tbody.selectAll("tr")
        .data(vis.iedDetailDisplayData, function(d) { return d.id;});

    rows
        .enter()
        .append("tr");

    // create a cell in each row for each column
    cells = rows.selectAll("td")
        .data(function(row) {
            return vis.displayColumns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        // .attr("style", "font-family: 'Roboto', sans-serif") // sets the font style
        .html(function(d) {
            if (d.column == "kia") {
                return "<img src='img/person2.svg' class='imgIcon'>" + d.value;
            }
            if (d.column == "wia") {
                return "<img src='img/person.svg' class='imgIcon'>" + d.value;
            }
            else {
                return d.value;
            }
        });



    rows
        .exit()
        .remove();
    */
    vis.displayText(vis.iedDetailDisplayData);

}


SankeyVis.prototype.displayText = function(nodes,words){
    var vis = this;


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
            })
            ;

        var textTimelineBlockImgBot = textTimelineBlock.append("div")
            .attr("class",function(d) {
                if(d.kia > 0 & d.wia > 0){
                    return "cd-timeline-img-bot cd-picture"
                } else {
                    return "";
                }
            })
            .append("img")
            .attr("src",function(d){
                if(d.kia > 0 & d.wia > 0){
                    return "img/person-wounded.svg";
                }else {
                    return "";
                }
            })
            ;

        var textTimelineBlockContent = textTimelineBlock.append("div").attr("class","cd-timeline-content");
        textTimelineBlockContent.append("h2").text(function(d){
            return vis.dateFormat(d.date);
        });
        textTimelineBlockContent.append("p").html(function(d){
            var text = d.text;
            wordList.forEach(function(d){
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




