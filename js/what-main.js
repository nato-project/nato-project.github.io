var iedData = [];

// Variables for the visualization instances
var sankeyVis, timelineVis,countsVis;

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
            d.dateFmt = d.date;
            d.date = parseDate(d.date);
        });
        iedDataCsv.sort(function(a,b) { return Date(b.date) - Date(a.date) });

        iedData = iedDataCsv;

        // Create the visualizations
        createVis();
    })

function createVis() {
    // Instantiate visualization objects here
    sankeyVis = new SankeyVis("sankeyVis", iedData);
    timelineVis = new Timeline("timelineVis", iedData);
    countsVis = new Counts("countsVis", iedData,900,300);
}

function brushed() {
    // Set new domain if brush (user selection) is not empty
    sankeyVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();
    sankeyVis.tableFilter.type = "N/A";
    sankeyVis.tableFilter.outcome = "N/A";
    sankeyVis.sankeyChanged = 1;

    // Update map
    sankeyVis.wrangleData();

    // Count Vis
    countsVis.filter = timelineVis.brush.empty() ? [] : timelineVis.brush.extent();
    countsVis.wrangleData();
}

/*
function iedTypeSelect() {

    var selectBox = document.getElementById("iedTypeSelect");

    if (sankeyVis.sankeySelection != selectBox.options[selectBox.selectedIndex].value) {
        sankeyVis.sankeySelection = selectBox.options[selectBox.selectedIndex].value;
        sankeyVis.sankeyChanged = 1;
        sankeyVis.tableFilter.type = "N/A";
        sankeyVis.tableFilter.outcome = "N/A";
        sankeyVis.wrangleData();
    }
}
*/


$("input:radio[name=reporttype]").click(function(){

    // Update text vis
    if (sankeyVis.sankeySelection != $("input:radio[name=reporttype]:checked").val()) {
        sankeyVis.sankeySelection = $("input:radio[name=reporttype]:checked").val();
        sankeyVis.sankeyChanged = 1;
//        sankeyVis.tableFilter.type = "N/A";
//        sankeyVis.tableFilter.outcome = "N/A";
        // initialize default selection
        sankeyVis.tableFilter.type = "PROJECTED";
        sankeyVis.tableFilter.outcome = "Wounded";
        sankeyVis.texttimelinetitle.text("PROJECTED → Wounded");

        sankeyVis.wrangleData();
    }
})

function showMeHoaxes(){
    $("input:radio[name=reporttype]:radio[value=byTypeAndOutcome]").prop('checked', true);

        sankeyVis.sankeySelection = "byTypeAndOutcome";
        sankeyVis.sankeyChanged = 1;
        sankeyVis.tableFilter.type = "HOAX/FALSE";
        sankeyVis.tableFilter.outcome = "N/A";
        sankeyVis.texttimelinetitle.text("HOAX/FALSE → No Casualties");

        sankeyVis.wrangleData();
}

function showMeFound(){
    $("input:radio[name=reporttype]:radio[value=byTypeAndOutcome]").prop('checked', true);

    sankeyVis.sankeySelection = "byTypeAndOutcome";
    sankeyVis.sankeyChanged = 1;
    sankeyVis.tableFilter.type = "CACHE/FOUND";
    sankeyVis.tableFilter.outcome = "N/A";
    sankeyVis.texttimelinetitle.text("CACHE/FOUND → No Casualties");

    sankeyVis.wrangleData();
}

function showMeRCIED(){
    $("input:radio[name=reporttype]:radio[value=byType]").prop('checked', true);

    sankeyVis.sankeySelection = "byType";
    sankeyVis.sankeyChanged = 1;
    sankeyVis.tableFilter.type = "RCIED";
    sankeyVis.tableFilter.outcome = "Wounded";
    sankeyVis.texttimelinetitle.text("RCIED → Wounded");

    sankeyVis.wrangleData();
}

function showMeVBIED(){
    $("input:radio[name=reporttype]:radio[value=byType]").prop('checked', true);

    sankeyVis.sankeySelection = "byType";
    sankeyVis.sankeyChanged = 1;
    sankeyVis.tableFilter.type = "VBIED";
    sankeyVis.tableFilter.outcome = "Killed";
    sankeyVis.texttimelinetitle.text("VBIED → Killed");

    sankeyVis.wrangleData();
}