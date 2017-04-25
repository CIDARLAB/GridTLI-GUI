function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function linspace(a,b,n) {
    if(typeof n === "undefined") {
        n = Math.max(Math.round(b-a)+1,1);
    }
    if(n<2) {
        return n===1?[a]:[];
    }
    var i,ret = Array(n);
    n--;
    for(i = n;i >= 0;i--) {
        ret[i] = round((i*b+(n-i)*a)/n, 2);
    }
    return ret;
}

function changeValues(){
    grid.removeChildren(); // delete previous grid

    // get new grid values:
    var spatialMin = document.getElementById('smin').value;
    var spatialMax = document.getElementById('smax').value;
    var spatialThresh = document.getElementById('sThresh').value;
    nSpatialDivs = Math.ceil((spatialMax - spatialMin) / spatialThresh);
    
    var timeMax = document.getElementById('tmax').value;
    var timeThresh = document.getElementById('tThresh').value;
    nTimeDivs = Math.ceil(timeMax / timeThresh);
   
    timeValues = linspace(0,timeMax,nTimeDivs + 1)
    spatialValues = linspace(spatialMin,spatialMax,nSpatialDivs + 1)
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
    var bottomLeftPoint = new paper.Point(50 ,cnvsSize.bottom - 50);
    var topLeftPoint = new paper.Point(50, 10);
    var bottomRightPoint = new paper.Point(cnvsSize.right - 10,cnvsSize.bottom - 50);
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
    cnvs.activate(); // Define active layer:
}

function colorBoxes(nWide, nTall, cnvsSize, gridGroup, allPaths) {
    /* this runs over all the rectangles on the grid and colors
    each box that a line crosses into */
    grid.activate(); // Define active layer:

    // define the rectangle sizes from the grid
    var rect_width = (cnvsSize.width - 60) / nWide;
    var rect_height = (cnvsSize.height - 60) / nTall;
    // define hit test parameters
    var hitOptions = {
        segments: false,
        stroke: false,
        fill: true,
        tolerance: 1
    };

    // find the crossing points between the path and the grid lines:
    for (i = 0; i < gridGroup.children.length; i++) {
        gridGroup.children[i].fillColor = null; // for each box, fillColor is removed
        for (j = 0; j < allPaths.length; j++) {
            var crossings = allPaths[j].getCrossings(gridGroup.children[i]);
            if (crossings.length >= 1) {
                gridGroup.children[i].fillColor = "#08CA75"; // for each crossing, fillColor is added
                break; // once it's colored, moves onto next box without performing further checks
            } 
        }
    }
    cnvs.activate(); // Define active layer
    }


function changePathValues(allPathsList, timeMax, spatialMin, spatialMax) {
    adjustedOutput = []; // initializes as empty array
    // txt.content = 'got through 1';
    for (i = 0; i < allPathsList.length; i++) { // for all the paths
        adjustedOutput[i] = []; // initializes an empty subarray
        // txt.content = "got through 2";
        for (j = 0; j < allPathsList[i].length; j++) { // for all pairs in the current path
            if (j%2 == 0) {
                adjustedOutput[i].push((allPathsList[i][j] - 50) * timeMax / 650);
            } else {
                adjustedOutput[i].push(((460 - allPathsList[i][j]) * (spatialMax - spatialMin) / 450) + spatialMin);
            }
            // txt.content = "got through 3 or 4...";
        }
    }
    return adjustedOutput;
}

function saveData(args) {
	// initialize the variables used in the save data.
	var the_data, hiddenElement, filename; 
	var the_json = project.exportJSON(); 
	var js_string = JSON.stringify(the_json);
	// convert the JSON object to strin using stringify
	var data = "data:text/json;charset=utf-8," + encodeURIComponent(js_string); 
	// if there is no filename just call it 'data.json' default filename is
	// data.json, we may want to add a capability where user choses their own 
	// filename.
	filename = args.filename || 'data.json';
	hiddenElement = document.createElement('a');
	hiddenElement.setAttribute('href', data);
	hiddenElement.setAttribute('download', filename);
	document.body.appendChild(hiddenElement);
	// the code above converts the json files to a document and 
	// then creates a link to them that the function then "clicks"
	// to download the json file.
	hiddenElement.click(); 
}