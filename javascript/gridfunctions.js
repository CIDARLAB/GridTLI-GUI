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
    pointList = [];
    for (i = 0; i < path.segments.length; i++) {
        pointList.push(path.segments[i].point)
    }
    return pointList
}

function getPathIndex(path) {
    var currentChildren = project.activeLayer.children;
    for (i = 0; i < currentChildren.length; i++) {
        if (currentChildren[i] == project.getItems({ selected: true })[1]) {
            path = project.activeLayer.children[i];
            var pathIndex = i; // will be appended to existing path
        }
    }
    return pathIndex
}

function changeGraphAxes() {
    grid.removeChildren(); // delete previous grid

    // get new grid values:
    var spatialMin = document.getElementById('smin').value;
    var spatialMax = document.getElementById('smax').value;
    var spatialThresh = document.getElementById('sThresh').value;
    nSpatialDivs = Math.ceil((spatialMax - spatialMin) / spatialThresh);

    var timeMax = document.getElementById('tmax').value;
    var timeThresh = document.getElementById('tThresh').value;
    nTimeDivs = Math.ceil(timeMax / timeThresh);

    timeValues = linspace(0, timeMax, nTimeDivs + 1)
    spatialValues = linspace(spatialMin, spatialMax, nSpatialDivs + 1)
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

    var width_per_rect = (cnvsSize.width - 60) / nWide;
    var height_per_rect = (cnvsSize.height - 60) / nTall;

    // draw x-axis tick marks
    for (var i = 0; i <= nWide; i++) {
        var xPos = 50 + i * width_per_rect;
        var xPos2 = cnvsSize.bottom - 55;
        var topPoint = new paper.Point(xPos, xPos2);
        var bottomPoint = new paper.Point(xPos, cnvsSize.bottom - 45);
        var aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = '#000';
        var xticks = new PointText(new Point(xPos - 5, cnvsSize.bottom - 30));
        xticks.content = timeValues[i];
    }

    // draw y-axis tick marks
    for (var i = 0; i <= nTall; i++) {
        var yPos = 10 + i * height_per_rect;
        var yPos2 = 45 + 10;
        var leftPoint = new paper.Point(45, yPos);
        var rightPoint = new paper.Point(45 + 10, yPos);
        var aLine = new paper.Path.Line(leftPoint, rightPoint);
        aLine.strokeColor = '#000';
        var yticks = new PointText(new Point(cnvsSize.left + 25, yPos + 5));
        yticks.content = spatialValues[i];
    }

    // draw x and y axis lines
    var bottomLeftPoint = new paper.Point(50, cnvsSize.bottom - 50);
    var topLeftPoint = new paper.Point(50, 10);
    var bottomRightPoint = new paper.Point(cnvsSize.right - 10, cnvsSize.bottom - 50);
    var aLine = new paper.Path.Line(bottomLeftPoint, bottomRightPoint)
    aLine.strokeColor = '#000';
    var aLine = new paper.Path.Line(bottomLeftPoint, topLeftPoint)
    aLine.strokeColor = '#000';

    var gridGroup = new Group(); // group for the gridLines, used for colorBoxes
    gridGroup.removeChildren(); // if children, remove them

    // draw rectangles (grid lines):
    for (var i = 0; i < nWide; i++) {
        for (var j = 0; j < nTall; j++) {
            var rect = new Path.Rectangle({
                point: [50 + i * width_per_rect, 10 + j * height_per_rect],
                size: [width_per_rect, height_per_rect],
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

    // find the crossing points between the path and the grid lines:
    for (i = 0; i < gridGroup.children.length; i++) {
        gridGroup.children[i].fillColor = null; // for each box, fillColor is removed
        var crossings = [];
        for (j = 0; j < allPaths.length; j++) {
            crossings[j] = allPaths[j].getCrossings(gridGroup.children[i]);
            if (crossings[j].length >= 1) {
                gridGroup.children[i].fillColor = "#08CA75"; // for each crossing, fillColor is added
                break; // once it's colored, moves onto next box without performing further checks
            }
        }
    }

    // for paths with no crossings:
    for (j = 0; j < allPaths.length; j++) {
        if (crossings[j].length == 0) {
            for (i = 0; i < gridGroup.children.length; i++) {
                if (gridGroup.children[i].fillColor == null) { // only checks uncolored boxes
                    current_point = gridGroup.children[i].point; // top left point of the current rectangle
                    for (k = 0; k < allPaths[j].segments.length; k++) { // for each point on the line
                        if ((current_point[0] <= allPaths[j].segments[k].point.x) &&
                            (allPaths[j].segments[k].point.x <= current_point[0] + rect_width) &&
                            (current_point[1] <= allPaths[j].segments[k].point.y) &&
                            (allPaths[j].segments[k].point.y <= current_point[1] + rect_height)) {
                            gridGroup.children[i].fillColor = "#08CA75";
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
    // get the filename (default = 'gridData.json')
    var jsonArray = convertPathsToJSON();
     $.ajax({
        url: "getSTL",
        type: "POST",
        data: {
            "bar":"foo",
            "signals": JSON.stringify(jsonArray)
        },
        success: function (response) {
            alert('got something back!');
            filename = "gotit.json";
            encodeJSON(response, filename);
        },
        error: function () {
            alert("ERROR!!");
        }
    });
}

function encodeJSON(result, filename) {
    // converts result/response file to a document and "clicks" to download
    var result_string = JSON.stringify(result);
    var hiddenElement;
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(result_string);
    hiddenElement = document.createElement('a');
    hiddenElement.setAttribute('href', data);
    hiddenElement.setAttribute('download', filename);
    document.body.appendChild(hiddenElement);
    hiddenElement.click();
}

function convertPathsToJSON() {
    var jsonArray = [];
    for (i = 0; i < cnvs.children.length; i++) {
        //var signalMap = {};     
        var signal = [];
        for (j = 0; j < cnvs.children[i].segments.length; j++) {
            var adjustedPair = changeCoordinateValues(cnvs.children[i].segments[j]);
            var map = {};
            map["x"] = adjustedPair.x;
            map["y"] = adjustedPair.y;
            signal.push(map);
        }
        //signalMap[i] = signal;
        jsonArray.push(signal);  
    }
    return jsonArray;
}

function changeCoordinateValues(currentPath) {
    var adjustedPair = {}; // initializes as empty array
    adjustedPair["x"] = (currentPath.point.x - 50) * timeMax / 650;
    adjustedPair["y"] = ((460 - currentPath.point.y) * (spatialMax - spatialMin) / 450) + spatialMin;
    return adjustedPair;
}