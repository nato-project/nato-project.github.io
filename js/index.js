var iedData = [];

// Variables for the visualization instances
var timelineVis,countsVis;

// Start application by loading the data
queue()
    .defer(d3.csv, "data/ied_data.csv")
    .await(function(error, iedDataCsv) {

        // Date parser to convert strings to date objects
        var parseDate = d3.time.format("%m/%d/%Y").parse;

        // Convert numeric values to 'numbers'
        iedDataCsv.forEach(function(d) {
            d.kia = +d.kia;
            d.wia = +d.wia;
            d.id = +d.id;
            d.lat = parseFloat(d.lat);
            d.lng = parseFloat(d.lng);
            d.date = parseDate(d.date);
        });
        iedData = iedDataCsv;


        // Create the visualizations
        createVis();

        // Add mouse over to the explore data boxes
        var exploreBoxes = d3.selectAll(".explore-data-container");
        //console.log(exploreBoxes);

        exploreBoxes.on("mouseover",function(d){
                d3.select(this).select("p").transition().duration(250).style("visibility", "hidden");
                d3.select(this).select("img").transition().delay(250).duration(250).style("opacity", 1);
            })
            .on("mouseout",function(d){
                d3.select(this).select("img").transition().duration(250).style("opacity", 0.3);
                d3.select(this).select("p").transition().delay(250).duration(250).style("visibility", "visible");

            });

        var readBoxes = d3.selectAll(".read-data-container");
        //console.log(exploreBoxes);

        readBoxes.on("mouseover",function(d){
                d3.select(this).select("p").transition().duration(250).style("visibility", "hidden");
                d3.select(this).select("img").transition().delay(250).duration(250).style("opacity", 1);
            })
            .on("mouseout",function(d){
                d3.select(this).select("img").transition().duration(250).style("opacity", 0.3);
                d3.select(this).select("p").transition().delay(250).duration(250).style("visibility", "visible");

            })
    });

function createVis() {
    // Instantiate visualization objects here
    timelineVis = new TimelineIndex("timelineVis", iedData,1100,400);
    countsVis = new Counts("countsVis", iedData,800,300,true);
}