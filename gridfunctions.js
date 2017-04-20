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
    // delete previous grid and reinitialize
    grid.removeChildren();

    var spatialMin = document.getElementById('smin').value;
    var spatialMax = document.getElementById('smax').value;
    
    var timeMax = document.getElementById('tmax').value;
    var spatialThresh = document.getElementById('sThresh').value;
    var timeThresh = document.getElementById('tThresh').value;
    
    spatialDivs = Math.ceil((spatialMax - spatialMin) / spatialThresh);
    timeDivs = Math.ceil(timeMax / timeThresh);
   
    timeValues = linspace(0,timeMax,timeDivs + 1)
    spatialValues = linspace(spatialMin,spatialMax,spatialDivs + 1)
    spatialValues.reverse() // grid writes top to bottom, therefore reverse the y-axis values

    // draw the new grid
    gridGroup = drawGrid(timeDivs, spatialDivs, timeValues, spatialValues, view.bounds);

    // document.getElementById('xtmin').value = spatialMin;
    // document.getElementById('xtmax').value = spatialMax;
    // document.getElementById('ytmax').value = spatialDivs;
    // document.getElementById('ct').value = timeDivs;
    // document.getElementById('xrange').value = spatialValues;
    // document.getElementById('yrange').value = timeValues;
    return gridGroup;
};

function drawGrid(nWide, nTall, xAxisVals, yAxisVals, cnvsSize) {
    // Define active layer:
    grid.activate()

    var xlabel = new PointText({
        point: new Point(((cnvsSize.right - 60) / 2), cnvsSize.bottom - 3),
        content: "X Label",
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
        var yPos = cnvsSize.top + 10 + i * height_per_rect;
        var yPos2 = 45 + 10;
        var leftPoint = new paper.Point(45, yPos);
        var rightPoint = new paper.Point(yPos2, yPos);
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

 //   var txt2 = new PointText({point: new Point(200, 50)}); // for testing purposes:
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
 //           txt2.content = gridGroup.children.length;
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
                break; // once it's colored, moves onto next box
            } 
        }
    }
    cnvs.activate(); // Define active layer
    }
