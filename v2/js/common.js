
// Load Header template
$(function() {

    $('#header').load('templates/header.html', function() {

        var page = document.location.pathname.match(/[^\/]+$/)[0];
        console.log(page);

        switch(page) {
            case "index.html":
                $('#index_page_menu').addClass("active");
                break;
            case "map.html":
                $('#where_page_menu').addClass("active");
                break;
            case "what.html":
                $('#what_page_menu').addClass("active");
                break;
            case "how.html":
                $('#how_page_menu').addClass("active");
                break;
            case "process.html":
                $('#process_menu').addClass("active");
                break;
            default:
                $('#index_page_menu').addClass("active");
        }

    });


});

var COMMON_COLORS ={
    "KILLED": "#900808",
    "WOUNDED": "#ff8100",
    "INCIDENT": "#bdbdbd",
    "NO_CASUALITY": "#d9d9d9",
    "CACHE/FOUND":"#fccde5",
    "CRIME":"#d9d9d9",
    "CWIED":"#bc80bd",
    "HOAX/FALSE":"#ccebc5",
    "PROJECTED":"#8dd3c7",
    "RCIED":"#ffffb3",
    "S-PBIED":"#bebada",
    "TIME DELAY":"#fb8072",
    "UNKNOWN":"#80b1d3",
    "VBIED":"#fdb462",
    "VOIED":"#b3de69"
}
