function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function linspace(a, b, n) {
    if (typeof n === "undefined") {
        n = Math.max(Math.round(b - a) + 1, 1);
    }
    if (n < 2) {
        return n === 1 ? [a] : [];
    }
    var i, ret = Array(n);
    n--;
    for (i = n; i >= 0; i--) {
        ret[i] = round((i * b + (n - i) * a) / n, 2);
    }
    return ret;
}

function getPointsFromPath(path) {
    // gets a list of all points from path
    pointList = [];
    for (i = 0; i < path.segments.length; i++) {
        pointList.push(path.segments[i].point)
    }
    return pointList
}

function getPathIndex(path) {
    // retrieves index for current path
    var currentChildren = project.activeLayer.children;
    for (i = 0; i < currentChildren.length; i++) {
        if (currentChildren[i] == project.getItems({ selected: true })[1]) {
            path = project.activeLayer.children[i];
            var pathIndex = i; // will be appended to existing path
        }
    }
    return pathIndex
}

function checkInputValues(ids, vars) {
    var emsg = [];
    for (var i = 0; i < ids.length; i++) {
        var msg = "Error! ";
        if ($('#' + ids[i]).val() == "") {
            // if the id is empty (occurs on page initializing), sub in the known variable value
            $('#' + ids[i]).val(vars[i]);
        } else if ($('#' + ids[i]).val() == vars[i]) { 
            // if value and variable are equal, skip it due to no detected changes
            continue;
        }
        // checks for negative values, which would only be valid for smin and smax
        var test = ($('#' + ids[i]).val() <= 0); 
        // defines error message according to ID
        if (ids[i] == 'smin') {
            msg += "Spatial Minimum must be a number less than Spatial Max. Using last defined value: " +
                    spatialMin + ".\n";
            // if smin >= smax, return true (keeps old value); else, return false (takes new value)
            if ($('#' + ids[i+1]).val() == "") {
                test = ($('#' + ids[i]).val() >= vars[i+1]); 
            } else {
                test = ($('#' + ids[i]).val() >= $('#' + ids[i+1]).val());
            }
        } else if (ids[i] == 'smax') {
            msg += "Spatial Maximum must be a number greater than Spatial Minimum. Using last defined value: " + 
                    spatialMax + ".\n";
            if ($('#' + ids[i-1]).val() == "") {
                test = ($('#' + ids[i]).val() <= vars[i-1]);
            } else {
                test = ($('#' + ids[i]).val() <= $('#' + ids[i-1]).val());
            }
        } else if (ids[i] == 'sThresh') {
            msg += "Spatial Threshold must be a number greater zero. Using last defined value: " + 
                    spatialThresh + ".\n";
        } else if (ids[i] == 'tmax') {
            msg += "Temporal Maximum must be a number greater than zero. Using last defined value: " + 
                    timeMax + ".\n";
        } else if (ids[i] == 'tThresh') {
            msg += "Temporal Maximum must be a number greater than zero. Using last defined value: " + 
                    timeThresh + ".\n";
        } else if (ids[i] == 'cThresh') {
            msg += "Cluster Threshold must be a number greater zero. Using last defined value: " + 
                    clusterThresh + ".\n";
        }

        if (isNaN($('#' + ids[i]).val())) {
            emsg += msg;
            $('#' + ids[i]).val(vars[i]);            
        } else if ((test == true) && ($('#' + ids[i]).val() != "")) {
            emsg += msg;      
            $('#' + ids[i]).val(vars[i]); // assigns previous value to field
        } else if (test == false) {
            vars[i] = $('#' + ids[i]).val(); // assigns new value to field
        }
    }
    if (emsg != '') {
        alert(emsg); // displays all errors and course of action at the end
    }
    return(vars)
}

function changeGraphAxes() {
    grid.removeChildren(); // delete previous grid

    [spatialMin, spatialMax, spatialThresh, timeMax, timeThresh, clusterThresh] = checkInputValues(["smin","smax","sThresh","tmax","tThresh","cThresh"],
        [spatialMin, spatialMax, spatialThresh, timeMax, timeThresh, clusterThresh]);

    nSpatialDivs = Math.ceil((spatialMax - spatialMin) / spatialThresh);
    
    if (nSpatialDivs > 40) {
        nSpatialDivs = 40;
        spatialThresh = (spatialMax - spatialMin) / nSpatialDivs;
        $("#sThresh").val(spatialThresh);
        alert('Spatial resolution cannot be rendered properly. Spatial Threshold set to ' + spatialThresh);
    }

    nTimeDivs = Math.ceil(timeMax / timeThresh);
    if (nTimeDivs > 50) {
        nTimeDivs = 50;
        timeThresh = timeMax / nTimeDivs;
        $("#tThresh").val(timeThresh);
        alert('Temporal resolution cannot be rendered properly. Time Threshold set to ' + timeThresh);
    }

    // calculate time-axis values
    timeValues = [];
    for (var i = 0; i < parseFloat(timeMax); i += parseFloat(timeThresh)) {
        timeValues.push(i);
    }
    timeValues.push(parseFloat(timeMax));

    // calculate spatial-axis values
    spatialValues = [];
    for (var i = parseFloat(spatialMin); i < parseFloat(spatialMax); i += parseFloat(spatialThresh)) {
        spatialValues.push(i)
    }
    spatialValues.push(parseFloat(spatialMax));

    // timeValues = linspace(0, Math.floor(timeMax/timeThresh) * timeThresh, nTimeDivs + 1);
    // spatialValues = linspace(spatialMin, Math.floor(spatialMax/spatialThresh) * spatialThresh, nSpatialDivs + 1)

    spatialValues.reverse() // grid writes top to bottom, therefore reverse the y-axis values

    // draw the new grid
    gridGroup = drawGrid(nTimeDivs, nSpatialDivs, timeValues, spatialValues, view.bounds);
    colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children)

    return gridGroup;
};

function drawGrid(nWide, nTall, xAxisVals, yAxisVals, cnvsSize) {
    grid.activate() // Define active layer:

    var xlabel = new PointText({
        point: new Point(((cnvsSize.right - 60) / 2), cnvsSize.bottom - 3),
        content: "Time",
        fillColor: 'black',
    });

    var width_per_rect = (cnvsSize.width - 60) * timeThresh / (xAxisVals[xAxisVals.length - 1] - xAxisVals[0]);
    var height_per_rect = (cnvsSize.height - 60) * spatialThresh / (yAxisVals[0] - yAxisVals[yAxisVals.length - 1]); 

    // draw x-axis (temporal) tick marks
    for (var i = 0; i < nWide; i++) {
        var xPos = 50 + i * width_per_rect; // 50 is x-axis offset due to left margin
        var topPoint = new paper.Point(xPos, cnvsSize.bottom - 55);
        var bottomPoint = new paper.Point(xPos, cnvsSize.bottom - 45);
        var xTick = new paper.Path.Line(topPoint, bottomPoint);
        xTick.strokeColor = '#c00';
        var xVals = new PointText(new Point(xPos - 5, cnvsSize.bottom - 30));
        xVals.content = timeValues[i];
    }
    var specialWidth = cnvsSize.right - 10 - xTick.segments[0].point.x;
    
    // draw final tick mark
    var xPos = cnvsSize.right - 10;
    var topPoint = new paper.Point(xPos, cnvsSize.bottom - 55);
    var bottomPoint = new paper.Point(xPos, cnvsSize.bottom - 45);
    var xTick = new paper.Path.Line(topPoint, bottomPoint);
    xTick.strokeColor = '#c00';
    var xVals = new PointText(new Point(xPos - 5, cnvsSize.bottom - 30));
    xVals.content = timeValues[timeValues.length - 1];

    // draw y-axis (spatial) tick marks

    // draw first tick mark (draws top -> bottom therefore first)
    // var yPos = 10; // 10 is y-axis offset due to top margin
    // var leftPoint = new paper.Point(45, yPos);
    // var rightPoint = new paper.Point(45 + 10, yPos);
    // var yTick = new paper.Path.Line(leftPoint, rightPoint);
    // yTick.strokeColor = '#00c';
    // var yVal = new PointText(new Point(cnvsSize.left + 25, yPos + 5));
    // yVal.content = spatialValues[0];

    // draw y-axis (spatial) tick marks
    var specialHeight = cnvsSize.height - 50 - height_per_rect * (nTall - 1); // -50 only corrects for bottom offset, not top offset
    for (var j = 0; j <= nTall; j++) {
        if (j == 0) {
            var yPos = 10;
        } else if (j == 1) {
            var yPos = specialHeight;
        } else {
            var yPos = specialHeight + (j-1) * height_per_rect; // 10 is y-axis offset due to top margin
        }
        var leftPoint = new paper.Point(45, yPos);
        var rightPoint = new paper.Point(45 + 10, yPos);
        var yTick = new paper.Path.Line(leftPoint, rightPoint);
        yTick.strokeColor = '#00c';
        var yVal = new PointText(new Point(cnvsSize.left + 25, yPos + 5));
        yVal.content = spatialValues[j];
        // if (i == 1) {
        //     var specialHeight = yTick.segments[0].point.y - 10; // 10 is y-axis offset due to top margin            
        // }
    }

    // define final points of axis lines
    var bottomLeftPoint = new paper.Point(50, cnvsSize.bottom - 50);
    var topLeftPoint = new paper.Point(50, 10);
    var bottomRightPoint = new paper.Point(cnvsSize.right - 10, cnvsSize.bottom - 50);
    // draw x and y axis lines
    var xAxis = new paper.Path.Line(bottomLeftPoint, bottomRightPoint)
    xAxis.strokeColor = '#0c0';
    var yAxis = new paper.Path.Line(bottomLeftPoint, topLeftPoint)
    yAxis.strokeColor = '#0c0';

    var gridGroup = new Group(); // group for the gridLines, used for colorBoxes
    gridGroup.removeChildren(); // if children, remove them

    // draw rectangles (grid lines):
    for (var i = 0; i < nWide; i++) {
        for (var j = 0; j < nTall; j++) {
            if (i == (nWide - 1)) {
                var rectWidth = specialWidth;
            } else {
                var rectWidth = width_per_rect;
            }
            if (j == 0) {
                var rectHeight = specialHeight - 10; // removes -10 offset from top
            } else {
                var rectHeight = height_per_rect;
            }
            if (j > 0) {
                ypt = 10 + (j-1) * rectHeight + gridGroup.children[0].size[1];
            } else {
                ypt = 10;
            }
            var rect = new Path.Rectangle({
                point: [50 + i * width_per_rect, ypt],
                size: [rectWidth, rectHeight],
                strokeColor: "#777",
                strokeWidth: ".5",
                fillColor: null,
            });
            gridGroup.addChild(rect);
        }
    }

    return gridGroup; // returns the grid boxes group 
}

function colorBoxes(nWide, nTall, cnvsSize, gridGroup, allPaths) {
    /* this runs over all the rectangles on the grid and colors
    each box that a line crosses into */
    grid.activate(); // Define active layer:

    // define the rectangle sizes from the grid
    var rect_width = (cnvsSize.width - 60) / nWide;
    var rect_height = (cnvsSize.height - 60) / nTall;

    var crossings = [];    
    // find the crossing points between the path and the grid lines:
    for (i = 0; i < gridGroup.children.length; i++) {
        gridGroup.children[i].fillColor = null; // for each box, fillColor is removed
        for (j = 0; j < allPaths.length; j++) {
            // check if the path is an outlier
            // if (checkOutliers(allPaths[j]) == true) {
            //     allPaths[j].strokeColor = 'red'; // highlight color
            //     crossings[j] = ["void"]; // won't check below for no-crossings possibility
            // } else {
                // if path not outlier: 
            crossings[j] = allPaths[j].getCrossings(gridGroup.children[i]);
            if (crossings[j].length >= 1) {
                gridGroup.children[i].fillColor = "#0275d8"; // for each crossing, fillColor is added
                break; // once colored, move on next box without performing further checks
            }
            // }
        }
    }

    // for paths with no crossings:
    for (j = 0; j < allPaths.length; j++) {
        if (crossings[j].length == 0 && crossings[j] != '') { // if the path has no crossings AND wasn't skipped over (i.e. falls in same boxes as another line)
            for (i = 0; i < gridGroup.children.length; i++) {
                if (gridGroup.children[i].fillColor == null) { // only checks uncolored boxes
                    current_point = gridGroup.children[i].point; // top left point of the current rectangle
                    for (k = 0; k < allPaths[j].segments.length; k++) { // for each point on the line
                        if ((current_point[0] <= allPaths[j].segments[k].point.x) &&
                            (allPaths[j].segments[k].point.x <= current_point[0] + rect_width) &&
                            (current_point[1] <= allPaths[j].segments[k].point.y) &&
                            (allPaths[j].segments[k].point.y <= current_point[1] + rect_height)) {
                            gridGroup.children[i].fillColor = "#0275d8";
                            break;
                        }
                    }
                }
            }
        }
    }
    cnvs.activate(); // Define active layer
}

function saveProject() {
    // get the filename (default = 'gridProject.json')
    var filename = prompt("Enter the file name below: ", "gridProject.json")
    if (!filename.endsWith(".json")) {
        filename += ".json";
    }
    // initialize the variables used in the save data.
    var the_data;
    var the_json = project.exportJSON();
    encodeJSON(the_json, filename);
}

function exportData() {
    // get the filename (default = 'gridData.json')
    var filename = prompt("Enter the file name below: ", "gridData.json")
    if (!filename.endsWith(".json")) {
        filename += ".json";
    }
    var jsonArray = convertPathsToJSON();
    encodeJSON(jsonArray, filename);
}

function getSTL() {
    var jsonArray = convertPathsToJSON();

    [spatialThresh, timeThresh, clusterThresh] = checkInputValues(["sThresh","tThresh","cThresh"],
            [spatialThresh, timeThresh, clusterThresh]);

     $.ajax({
        url: "getSTL",
        type: "POST",
        data: {
            "bar":"foo",
            "signals": JSON.stringify(jsonArray), 
            "xt": spatialThresh,
            "tt": timeThresh,
            "ct": clusterThresh,
        },
        success: function (response) {
            filename = "stl.txt";
            writeSTL(response, filename);
        },
        error: function () {
            console.log("ERROR!!");
        }
    });
}

function encodeJSON(result, filename) {
    // converts result/response file to a document and "clicks" to download
    var result_string = JSON.stringify(result,null,2);
    var hiddenElement;
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(result_string);
    hiddenElement = document.createElement('a');
    hiddenElement.setAttribute('href', data);
    hiddenElement.setAttribute('download', filename);
    document.body.appendChild(hiddenElement);
    hiddenElement.click();
}

function writeSTL(result, filename) {
    // converts result/response file to a document and "clicks" to download
    var hiddenElement;
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(result);
    hiddenElement = document.createElement('a');
    hiddenElement.setAttribute('href', data);
    hiddenElement.setAttribute('download', filename);
    document.body.appendChild(hiddenElement);
    hiddenElement.click();
}

function convertPathsToJSON() {
    var jsonArray = [];
    for (i = 0; i < cnvs.children.length; i++) {
        var signal = [];
        for (j = 0; j < cnvs.children[i].segments.length; j++) {
            var adjustedPair = changeCoordinateValues(cnvs.children[i].segments[j]);
            var map = {};
            map["x"] = adjustedPair.x;
            map["y"] = adjustedPair.y;
            signal.push(map);
        }
        jsonArray.push(signal);  
    }
    return jsonArray;
}

function changeCoordinateValues(currentSegment) {
    var adjustedPair = {}; // initialize empty array
    adjustedPair["x"] = (currentSegment.point.x - 50) * timeMax / (paper.view.bounds.width - 60);
    adjustedPair["y"] = (((paper.view.bounds.height - 50) - currentSegment.point.y) * (spatialMax - spatialMin) / (paper.view.bounds.height - 60)) + spatialMin;
    // console.log(currentSegment.point.x, currentSegment.point.y)
    // console.log(adjustedPair.x, adjustedPair.y)
    return adjustedPair;
}

function importData() {
    // take the JSON file
    var stlArray = convertPathsToJSON(); // for testing, gets the coords from the STL formula
    // this is a first pass, but will only handle a "single behavior" STL; it will need to be 
    // split into "segments" later on so that behaviors can be observed in each individual part of the formula. 
    var spatialBound = [1,-5]; // this value should be provided by the tool for the upper/lower bounds
    var tBound = []; // also provided for start/stop values;

    // convert the file from STL coordinates to graph coordinates
    convertJSONtoPaths(stlArray);
}

function convertJSONtoPaths(stlArray) {
    // takes in a JSON file containing the STL coordinates, converts the paths to canvas coordinates
    // and places the paths on the canvas
    for (var i = 0; i < stlArray.length; i++) { // length = number of paths
        var path = new Path({
            strokeColor: 'black',
            selected: false,
        })
        for (var j = 0; j < stlArray[i].length; j++) {
            path.add(changeSTLCoords(stlArray[i][j]));
        }
    }
}

function changeSTLCoords(stlCoord) {
    var gridPair = {}; // initialize empty array
    gridPair.x = (stlCoord["x"] * (paper.view.bounds.width - 60) / timeMax) + 50;
    gridPair.y = (paper.view.bounds.height - 50) - ((stlCoord["y"] - spatialMin)*(paper.view.bounds.height - 60)) / (spatialMax - spatialMin);
    // console.log(stlCoord.x, stlCoord.y)
    // console.log(gridPair.x, gridPair.y)
    return gridPair;
}

function ssConvertPathsToJSON() {
    // conversion specific to session storage
    // converts paths on canvas to json file in x-y pairs
    var jsonArray = [];
    for (i = 0; i < cnvs.children.length; i++) {
        var signal = [];
        for (j = 0; j < cnvs.children[i].segments.length; j++) {
            var adjustedPair = cnvs.children[i].segments[j];
            var map = {};
            map["x"] = adjustedPair.point["x"];
            map["y"] = adjustedPair.point["y"];
            signal.push(map);
        }
        jsonArray.push(signal);  
    }
    return jsonArray;
}

function ssConvertJSONtoPaths(pathArray) {
    // conversion specific to session storage
    // takes in a JSON file containing the path coordinates and places the paths on the canvas
    for (var i = 0; i < pathArray.length; i++) { // length = number of paths
        var path = new Path({
            strokeColor: 'black',
            selected: false,
        })
        for (var j = 0; j < pathArray[i].length; j++) {
            path.add(pathArray[i][j]);
        }
    }
}

// possible format for the JSON version of the STL formula:
// var jsonSTL = 
// '[' + 
//     '{' + 
//         '"G": "[0.0, 6.0]",' +
//         '"x": "<= 2.0"' +
//     '},' +
//     '{' +
//         '"G": "[0.0, 1.0]",' +
//         '"x": ">= 0.0"' +
//     '},' +
//     '{' +
//         '"G": "[1.0, 5.0]",' +
//         '"x": ">= 1.0"' +
//     '},' +
//     '{' +
//         '"G": "[5.0, 6.0]",' +
//         '"x": ">= 0.0"' +
//     '}' +
// ']';

// function checkOutliers(path) {
//     // checks a given path for outliers, colors red if yes
//     stlBounds = $.parseJSON(jsonSTL);
//     outOfBounds = false;
//     // for each segment on the path
//     for (var i = 0; i < path.segments.length; i++) {
//         if (outOfBounds == true) {
//             break;
//         }
//         var currentSeg = changeCoordinateValues(path.segments[i]) // convert canvas coords to STL values
//         // iterate through each of the bounds:
//         for (var j = 0; j < stlBounds.length; j++) {
//             if (outOfBounds == true) {
//                 break;
//             }
//             // establish left and right bounds
//             var leftBound = stlBounds[j].G.substring(1,4);
//             var rightBound = stlBounds[j].G.substring(6,9);
//             // if the segment falls within the x-axis (temporal) bounds:
//             if (currentSeg.x >= leftBound && currentSeg.x <= rightBound) {
//                 // compare if >= or <= the defined y-axis (spatial) bound
//                 if (stlBounds[j].x.substring(0,2) == '>=') {
//                     if (currentSeg.y < stlBounds[j].x.substring(3,7)) {
//                         outOfBounds = true;
//                     }
//                 } else {
//                     if (currentSeg.y > stlBounds[j].x.substring(3,7)) {
//                         outOfBounds = true;
//                     }
//                 }
//             }
//         }
//     }

//     return outOfBounds;
// }