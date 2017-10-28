// temporary variables for project and username; should be stored/fetched from the server
var projectName = 'Grid-Based Temporal Logic Inference';
// var username = 'O. Loompa';

// NAVBAR
$(function(){
    $('.navbar').html(
        '<div class="container">' +
            '<div class="row">' +
                '<div class="col-2">' +
                    '<img src="./images/logo/phoenix_banner_black.png">' +
                '</div>' +
                '<div class="col-8">' +
                    '<div class="row">' +
                        '<div class="col-12">' +
                            '<div class="project-name" id="project-name">' +
                                projectName +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
});

// FOOTER
$(function(){
    $('.footer').html(
        '<span>' +
            '<img src="./images/logo/cidar_s.png">' +
        '</span>' +
        '<span>' +
            '<img src="./images/logo/BU.png">' +
        '</span>' +
        '<span>' +
            '<img src="https://www.nsf.gov/images/logos/nsf1.jpg">' +
        '</span>' +
        '<span>' +
            '<img src="./images/logo/ONRlogo.png">' +
        '</span>' +
        '<p class="text-muted">Funding for this project was provided by National Science Foundation' +
            'under CPS Frontier #1446607 and by the Office of Naval Research #N00014-11-1-10725.</p>' +
        '<div>' +
            '<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">' +
                '<img alt="Creative Commons License" src="http://i.creativecommons.org/l/by-sa/4.0/88x31.png">' +
            '</a>' +
            '<p class="text-muted">Phoenix is licensed under a' +
                '<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">' +
                    'Creative Commons Attribution-ShareAlike 4.0 International License' +
                '</a>' +
                '.' +
            '</p>' +
        '</div>' +
        '<p class="text-muted">Phoenix Web App was created by Kat, Oompa Loompa Extraordinaire</p>'
    );
});

$(function(){
    $('.remove-signal-glyph').hide();
})

function addSig(){
    var sigName = window.prompt("New Signal Name: ","e.g. in1 or out1");
    if (sigName != null) {
        // add sigName to the option list; (sort alphabetically)
        $("#select-signal").append($("<li></li>").attr("id","opt-" + sigName))
        $("#opt-" + sigName).append($('<button class="remove-signal-glyph"' +
                'onClick="rmSig(\'' + sigName + '\')" title="Delete">' +
                    '<span class="fa fa-minus-circle"></span>' +
                '</button>' +
                '<span> ' + sigName + '</span>'));
        // create new tab, using sigName
        $('#tab-col').append($('<button></button>').val(sigName).html(sigName).addClass("tab-btn").attr("id", "tab-" + sigName + "-btn"))

        // .onClick("changeGridTab(event, 'tab-" + sigName + "-btn')")
        changeTab($("#tab-" + sigName + "-btn").click(), "tab-" + sigName + "-btn");
        showRM();
    }
}

function showRM() {
    if ($('.remove-signal-glyph').is(":visible")) {
        $('.remove-signal-glyph').hide();
    } else {
        $('.remove-signal-glyph').show();        
    }
}

function rmSig(sigName) {
    $('#opt-' + sigName).remove(); // remove from select list
    $('#tab-' + sigName + '-btn').remove(); // remove from tabs
}


function changeTab(evt, tabName) {
    if (evt.target) {
        evt = evt.target; // allows this to work even when simulating clicks with jquery .click()
    }
    if ($(evt).hasClass("active")) {
        return; // do nothing if clicked on active class
    }

    storeSignalLocalStorage($('button[class*="active"]')[0].id)
    // signalDictionary[$('button[class*="active"]')[0].id] = cnvs.children; // save lines
    cnvs.removeChildren(); // remove lines
    colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children); // recolor grid

    $('.tab-btn').removeClass("active"); // remove all active classes
    $(evt).addClass("active"); // add active class to clicked tab

    if (window.localStorage[evt.id] != null) {
        // newData = window.localStorage[evt.id];
        // jsonData = JSON.parse(window.localStorage[evt.id])
        allPathsList = retrieveSignalLocalStorage(evt.id)
        // spatialMax = jsonData["ymax"];
        // spatialMin = jsonData["ymin"];
        // timeMax = jsonData["tmax"];
        // spatialThresh = jsonData["yt"];
        // timeThresh = jsonData["tt"];
        // clusterThresh = jsonData["ct"];
        // allPathsList = jsonData["signals"];
        convertJSONtoPaths(allPathsList);
        changeGraphAxes(); // redraws the graph according to new data        
    } else {
        allPathsList = [];
    }
}

function storeSignalLocalStorage(tabName) {
    // creates a json file of the relevant data
    var jsonData = {};
    jsonData["ymax"] = spatialMax;
    jsonData["ymin"] = spatialMin;
    jsonData["tmax"] = timeMax;
    jsonData["yt"] = spatialThresh;
    jsonData["tt"] = timeThresh;
    jsonData["ct"] = clusterThresh;
    jsonData["signals"] = convertPathsToJSON(); 

    var jsonString = JSON.stringify(jsonData);
    window.localStorage.setItem(tabName, jsonString)
}

function retrieveSignalLocalStorage(tabName) {
    var jsonData = JSON.parse(window.localStorage[tabName]);
    spatialMax = jsonData["ymax"];
    spatialMin = jsonData["ymin"];
    timeMax = jsonData["tmax"];
    spatialThresh = jsonData["yt"];
    timeThresh = jsonData["tt"];
    clusterThresh = jsonData["ct"];

    $("#smax").val(jsonData["ymax"]);
    $("#smin").val(jsonData["ymin"]);
    $("#tmax").val(jsonData["tmax"]);
    $("#sThresh").val(jsonData["yt"]);
    $("#tThresh").val(jsonData["tt"]);
    $("#cThresh").val(jsonData["ct"]);

    allPathsList = jsonData["signals"]; 

    return allPathsList;
}