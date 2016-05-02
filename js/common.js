
// Load Header template
$(function() {

    $('#header').load('templates/header.html', function() {

        var page = "index.html";

        var match = document.location.pathname.match(/[^\/]+$/);
        if(match){
            page = match[0];
        }
        //console.log(page);

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

    $('#footer').load('templates/footer.html', function() {});


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

var IED_TYPE_DESC = {
    "UNKNOWN": "For many incidents, the type of IED was not identified.",
    "CRIME": "IEDs related to criminal activities.",
    "CACHE/FOUND": "In some cases, the authorities discovered the IED before it could cause damage.",
    "HOAX/FALSE": "Some of the reported incidents turned out to be fake.",
    "VOIED": "Victim-Operated IEDs, also known as booby traps, are designed to function upon contact with a victim. Switching methods include tripwire, pressure mats, spring-loaded release, push, pull or tilt.",
    "PROJECTED": "Thrown or projected IEDs are used mostly from overhead passes.",
    "VBIED": "A Vehicle Borne IED (VBIED) is a device that uses a vehicle as the package or container of the device.",
    "RCIED": "The trigger for a Radio-Controlled IED (RCIED) is controlled by radio link.",
    "S-PBIED": "Suicide Person-Borne IED usually refers to an individual wearing explosives and detonating them in order to kill others including themselves.",
    "CWIED": "A Command-Wire IED uses an electrical firing cable that affords the user complete control over the device right up until the moment of initiation.",
    "TIME DELAY": "This type of IED uses a time delay fuse to detonate at a later time."
}

var COMMON_REGIONS ={
    "volyn": "Volyn",
    "rv": "Rivne",
    "zt":"Zhytomyr",
    "kiev": "Kiev",
    "cn": "Chernihiv",
    "sm": "Sumy",
    "lviv": "L'viv",
    "uz": "Transcarpathia",
    "if": "Ivano-Frankivs'k",
    "te": "Ternopil'",
    "cv": "Chernivtsi",
    "km": "Khmel'nyts'kyy",
    "vn": "Vinnytsya",
    "ck": "Cherkasy",
    "pl": "Poltava",
    "kh": "Kharkiv",
    "kr": "Kirovohrad",
    "od": "Odessa",
    "mk": "Mykolayiv",
    "dp": "Dnipropetrovs'k",
    "ks": "Kherson",
    "crimea": "Crimea",
    "zp": "Zaporizhzhya",
    "dn": "Donets'k",
    "lu": "Luhans'k",
    "": "Ukraine"
}
