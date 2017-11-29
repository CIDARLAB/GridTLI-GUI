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
    addSig('In0');
    $(".remove-signal-glyph span").removeClass("fa-minus-circle");
    $(".remove-signal-glyph span").addClass("fa-circle");
    $('.remove-signal-glyph').hide();    
})

function addSig(sigName) {
    if (sigName == null) {
        sigName = window.prompt("New Signal Name: ","e.g. in1 or out1");
    }

    // add sigName to the option list; (sort alphabetically)
    $("#select-signal").append($("<li></li>").attr("id","opt-" + sigName))
    $("#opt-" + sigName).append($('<button class="remove-signal-glyph"' +
            'onClick="rmSig(\'' + sigName + '\')" title="Delete">' +
                '<span class="fa fa-minus-circle"></span>' +
            '</button>' +
            '<span onClick="changeTab($(\'#tab-' + sigName + '-btn\').click(), \'tab-' + sigName + '-btn\')"> ' + sigName + '</span>'));
    addTab(sigName);
    showRM();
}

function addTab(sigName) {
    // create new tab, using sigName
    $('#tab-col').append($('<button></button>').addClass("tab-btn").val(sigName).html(sigName).attr("id", "tab-" +
                         sigName + "-btn").attr("onClick","changeTab(event, 'tab-" + sigName + "-btn')"));

    // .onClick("changeGridTab(event, 'tab-" + sigName + "-btn')")
    changeTab($("#tab-" + sigName + "-btn").click(), "tab-" + sigName + "-btn");
}

function showRM() {
    if ($('.remove-signal-glyph').is(":visible")) {
        $('.remove-signal-glyph').hide();
    } else {
        $('.remove-signal-glyph').show();        
    }
}

function rmSig(sigName) {
    if ($("#tab-" + sigName + "-btn").hasClass("active")) {
        changeTab($("#tab-in0-btn").click(), "tab-in0-btn"); // resets to first tab
    }
    $('#opt-' + sigName).remove(); // remove from select list
    rmTab(sigName);
    window.sessionStorage.removeItem("tab-" + sigName + "-btn"); // remove from session Storage
}

function rmTab(sigName) {
    $('#tab-' + sigName + '-btn').remove(); // remove from tabs
}

function changeTab(evt, tabName) {
    if (evt.target) {
        evt = evt.target; // allows this to work even when simulating clicks with jquery .click()
    }
    if ($(evt).hasClass("active")) {
        return; // do nothing if clicked on active class
    }
    if (!$(evt.id).is(":visible")) {
        separateSigs();
    }

    if ($(".btn-tab").length > 1) {
        storeSignalLocalStorage($('button[class*="active"]')[0].id)
    }
    // signalDictionary[$('button[class*="active"]')[0].id] = cnvs.children; // save lines
    cnvs.removeChildren(); // remove lines
    colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children); // recolor grid

    $('.tab-btn').removeClass("active"); // remove all active classes
    $(evt).addClass("active"); // add active class to clicked tab

    if (window.sessionStorage[evt.id] != null) {
        allPathsList = retrieveSignalLocalStorage(evt.id)
        ssConvertJSONtoPaths(allPathsList);
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
    jsonData["signals"] = ssConvertPathsToJSON(); 

    var jsonString = JSON.stringify(jsonData);
    window.sessionStorage.setItem(tabName, jsonString)
}

function retrieveSignalLocalStorage(tabName) {
    var jsonData = JSON.parse(window.sessionStorage[tabName]);
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
var colors = ['black','red','blue','green','brown','deeppink','blueviolet','limegreen','fuchsia','lightseagreen'];

function collapseSigs() {
    // if signals already collapsed, do nothing:
    if ($("#tab-All-btn").hasClass("active")) {
        return
    }
    // graphs all lines on the same plot
    var collapseMax = 0;
    var collapseMin = 0;
    var collapseTime = 0;
    var tmpSTL = []; // array storing each signal with STL values
    // iterate through each tab
    for (var i = 0; i < $(".tab-btn").length; i++) {
        var tabID = $(".tab-btn")[i]["id"];
        if (window.sessionStorage[tabID] == null) {
            storeSignalLocalStorage(tabID)
        }
        var tmp = JSON.parse(window.sessionStorage[tabID]);
        collapseMax = Math.max(collapseMax, tmp["ymax"]);     // find max spatial value
        if (i == 0) {
            collapseMin = tmp["ymin"]; // sets collapseMin to first min value rather than 0 to avoid a min of zero
        } else {
            collapseMin = Math.min(collapseMin, tmp["ymin"]);     // find min spatial value            
        }
        collapseTime = Math.max(collapseTime, tmp["tmax"]);    // find max time value
        var sigArray = [];
        // convert all paths to STL coordinate values
        for (var j = 0; j < tmp["signals"].length; j++) {
            var sig = [];
            for (var k = 0; k < tmp["signals"][j].length; k++) {
                var pair = {};
                pair["x"] = (tmp["signals"][j][k]["x"] - 50) * tmp["tmax"] / (paper.view.bounds.width - 60);
                pair["y"] = eval((((paper.view.bounds.height - 50) - tmp["signals"][j][k]["y"]) * (tmp["ymax"] - tmp["ymin"]) / (paper.view.bounds.height - 60)) + tmp["ymin"]);
                sig.push(pair)
            }
            sigArray.push(sig);
        }
        tmpSTL.push(sigArray);
    }
    // remove all tabs, replace with "All"
    $(".tab-btn").hide();
    addTab("All");
    spatialMin = collapseMin;
    spatialMax = collapseMax;
    timeMax = collapseTime;
    // calculate reasonable threshold values
    changeGraphAxes();
    // with max/min vals, convert STL back to coords with new grid
    for (var i = 0; i < window.sessionStorage.length; i++) {
        // var tabID = $(".tab-btn")[i]["id"];
        // var tmp = JSON.parse(window.sessionStorage[tabID]);
        for (var j = 0; j < tmpSTL[i].length; j++) {
            var path = new Path({
                strokeColor: colors[i],
                selected: false,
            })
            for (var k = 0; k < tmpSTL[i][j].length; k++) {
                var pair = {};
                pair["x"] = (tmpSTL[i][j][k]["x"] * (paper.view.bounds.width - 60)) / collapseTime + 50;
                pair["y"] = (paper.view.bounds.height - 50) - ((tmpSTL[i][j][k]["y"] - collapseMin)*(paper.view.bounds.height - 60)) / (collapseMax - collapseMin) ;
                path.add(pair)
            }
        }
    }
}

function separateSigs() {
    // restore all tabs
    $(".tab-btn").show();

    // remove tab "All", which triggers reset to 1st tab 
    rmSig("All");

}