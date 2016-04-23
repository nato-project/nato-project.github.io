
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
            default:
                $('#index_page_menu').addClass("active");
        }

    });


});
