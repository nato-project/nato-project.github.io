
var iedData = [];
var iedTextLinks = [];

// Variables for the visualization instances
var wordCloudVis,fullTextVis, timelineVis;

// Start application by loading the data
queue()
    .defer(d3.csv, "data/ied_data.csv")
    .defer(d3.csv, "data/ied_text_links.csv")
    .await(function(error, iedDataCsv,iedTextLinksCsv) {

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

        iedTextLinksCsv.forEach(function(d) {
            d.s_id = +d.s_id;
            d.t_id = +d.t_id;
            d.cs_value = parseFloat(d.cs_value);
        });
        iedTextLinks = iedTextLinksCsv;


        // Create the visualizations
        createVis();
    });

function createVis() {
    // Instantiate visualization objects here
    //wordCloudVis = new WordCloud("mapVis", iedData, mapData, regionData);
    fullTextVis = new FullText("fullTextVis",iedData,iedTextLinks);
    timelineVis = new Timeline("timelineVis", iedData,760);
}

function brushed() {
    // Set new domain if brush (user selection) is not empty
    fullTextVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();

    // Update text vis
    fullTextVis.wrangleData();
}

// Threshold slider onchange
$('#thersholdSlider').on("change", function() {

    fullTextVis.threshold = $(this).val();
    $('#thersholdSliderValue').val($(this).val()+"%");
    // Update text vis
    fullTextVis.wrangleData();
});
$("input:radio[name=displaytype]").click(function(){

    fullTextVis.displaytype = $("input:radio[name=displaytype]:checked").val();
    // Update text vis
    fullTextVis.wrangleData();
});


