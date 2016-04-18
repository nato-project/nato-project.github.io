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
    });

function createVis() {
    // Instantiate visualization objects here
    timelineVis = new TimelineIndex("timelineVis", iedData,1100,400);
    countsVis = new Counts("countsVis", iedData,900,300);
}