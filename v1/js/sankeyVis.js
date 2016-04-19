var units = "IED Incidents";
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scale.category20(),


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

    this.initVis();

}

/*
 * Initialize area chart with brushing component
 */
SankeyVis.prototype.initVis = function() {
    var vis = this; // read about the this

    vis.margin = {top: 10, right: 0, bottom: 10, left: 0};

    vis.width = 550 - vis.margin.left - vis.margin.right,
        vis.height = 700 - vis.margin.top - vis.margin.bottom;

    //Initialize global variables
    vis.tableFilter = new Object();
    vis.tableFilter.type = "N/A";
    vis.tableFilter.outcome = "N/A";
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
        .nodeWidth(36)
        .nodePadding(40)
        .size([vis.width, vis.height]);

    vis.path =  vis.sankey.link();

    //IED detail table
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
                      return "WIA";
                  case "kia":
                      return "KIA";
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

    // Wrangle and update
    vis.wrangleData();

}

SankeyVis.prototype.wrangleData = function() {

    var vis = this; // read about the this

    console.log(vis.sankeySelection);

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
            var fourth = ( vis.tableFilter.outcome == "WIA" & d.wia > 0 )
                || ( vis.tableFilter.outcome == "KIA" & d.kia > 0 )
                || vis.tableFilter.outcome == "N/A";
            return third & fourth;
        });
    }
    if (vis.sankeySelection == "byTypeAndOutcome") {
        vis.iedDetailDisplayData = vis.iedDetailDisplayData.filter(function (d) {
            var third = (   vis.tableFilter.outcome == "N/A"
                            || ( vis.tableFilter.outcome == "Fatalities" & d.kia > 0
                                || vis.tableFilter.outcome == "Injuries" & d.kia == 0 & d.wia > 0
                                || vis.tableFilter.outcome == "Unknown" & d.kia == 0 & d.wia == 0
                )
                        );
            var fourth =  vis.tableFilter.type == "N/A" || vis.tableFilter.type == d.type;

            var fifth = (  vis.tableFilter.type == "N/A"
                            ||  ( vis.tableFilter.outcome == "Fatalities" & d.kia > 0
                                    ||  vis.tableFilter.outcome == "Injuries" & d.kia == 0 & d.wia > 0
                                    ||  vis.tableFilter.outcome == "Unknown" & d.kia == 0 & d.wia == 0
                                    || vis.tableFilter.outcome == "N/A")
                        );


            return third & fourth;
        });
    }


    vis.nodes = [];
    vis.edges = [];
    var destinationNodesArray = [];
    var newNode;

    if (vis.sankeySelection == "byType") {

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
        destinationNodesArray[destinationNodesArray.length] = 'WIA';
        destinationNodesArray[destinationNodesArray.length] = 'KIA';

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "WIA";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "KIA";
        vis.nodes.push(newNode);

        var newEdge;
        var existingEdge = -1;
        //add edges
        for (var i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].kia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('KIA')) {
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
                    newEdge.target = destinationNodesArray.indexOf('KIA');
                    newEdge.value = vis.displayData[i].kia;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'KIA';

                    vis.edges.push(newEdge);
                }
            }

            if (vis.displayData[i].wia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('WIA')) {
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
                    newEdge.target = destinationNodesArray.indexOf('WIA');
                    newEdge.value = vis.displayData[i].wia;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'WIA';

                    vis.edges.push(newEdge);
                }
            }
        }
        ;
    }
    if (vis.sankeySelection == "byTypeAndOutcome"){
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
        destinationNodesArray[destinationNodesArray.length] = 'Fatalities';
        destinationNodesArray[destinationNodesArray.length] = 'Injuries';
        destinationNodesArray[destinationNodesArray.length] = 'Unknown';
        destinationNodesArray[destinationNodesArray.length] = 'Incidents';

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Fatalities";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Injuries";
        vis.nodes.push(newNode);

        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Unknown";
        vis.nodes.push(newNode);


        newNode = new Object();
        newNode.node = vis.nodes.length;
        newNode.name = "Incidents";
        vis.nodes.push(newNode);


        var newEdge;
        var existingEdge = -1;
        var fatalities = 0, injuries = 0, unknown = 0;

        //add edges
        for (var i = 0; i < vis.displayData.length; i++) {
            if (vis.displayData[i].kia > 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Fatalities')) {
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
                    newEdge.target = destinationNodesArray.indexOf('Fatalities');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Fatalities';

                    vis.edges.push(newEdge);
                }
                fatalities++;
            }

            if (vis.displayData[i].wia > 0 && vis.displayData[i].kia == 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Injuries')) {
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
                    newEdge.target = destinationNodesArray.indexOf('Injuries');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Injuries';

                    vis.edges.push(newEdge);
                }
                injuries++;
            }

            if (vis.displayData[i].wia == 0 && vis.displayData[i].kia == 0) {
                existingEdge = -1;
                for (var j = 0; j < vis.edges.length; j++) {
                    if (vis.edges[j].source == destinationNodesArray.indexOf(vis.displayData[i].type)
                        & vis.edges[j].target == destinationNodesArray.indexOf('Unknown')) {
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
                    newEdge.target = destinationNodesArray.indexOf('Unknown');
                    newEdge.value = 1;
                    newEdge.type = vis.displayData[i].type;
                    newEdge.outcome = 'Unknown';

                    vis.edges.push(newEdge);
                }
                unknown++;
            }
        };

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("Fatalities");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = fatalities;
        newEdge.type = "N/A";
        newEdge.outcome = "Fatalities";
        vis.edges.push(newEdge);

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("Injuries");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = injuries;
        newEdge.type = "N/A";
        newEdge.outcome = "Injuries";
        vis.edges.push(newEdge);

        newEdge = new Object();
        newEdge.source = destinationNodesArray.indexOf("Unknown");
        newEdge.target = destinationNodesArray.indexOf("Incidents");
        newEdge.value = unknown;
        newEdge.type = "N/A";
        newEdge.outcome = "Unknown";
        vis.edges.push(newEdge);

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
                vis.tableFilter.outcome = d.outcome;

                /*
                 vis.iedDetailDisplayData = vis.iedData.filter(function(s) {
                 return ( s.city ).length > 1
                 & ( s.type == d.type )
                 & (( s.kia > 0 & d.outcome == "KIA")
                 || ( s.wia > 0 & d.outcome == "WIA"))
                 });
                 */
                console.log("Say What?");
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
                return d.color = color(d.name.replace(/ .*/, ""));
            })
            .style("stroke", function (d) {
                return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function (d) {
                return d.name + "\n" + format(d.value);
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
            .text(function (d) {
                return d.name;
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

}




