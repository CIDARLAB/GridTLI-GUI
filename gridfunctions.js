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
    drawGrid(timeDivs, spatialDivs, timeValues, spatialValues, view.bounds);

    document.getElementById('xtmin').value = spatialMin;
    document.getElementById('xtmax').value = spatialMax;
    document.getElementById('ytmax').value = spatialDivs;
    document.getElementById('ct').value = timeDivs;
    document.getElementById('xrange').value = spatialValues;
    document.getElementById('yrange').value = timeValues;
};

function drawGrid(nWide, nTall, xAxisVals, yAxisVals, cnvsSize) {
    var xlabel = new PointText(new Point(((cnvsSize.right - 60) / 2), cnvsSize.bottom - 3));
    xlabel.content = "X Label";

    var width_per_rect = (cnvsSize.width - 60) / nWide;
    var height_per_rect = (cnvsSize.height - 60) / nTall;

    for (var i = 0; i <= nWide; i++) {
        var xPos = 50 + i * width_per_rect;
        var topPoint = new paper.Point(xPos, cnvsSize.top + 10);
        var bottomPoint = new paper.Point(xPos, cnvsSize.bottom - 50);
        var aLine = new paper.Path.Line(topPoint, bottomPoint);
        aLine.strokeColor = '#999';
    }

    for (var i = 0; i <= nTall; i++) {
        var yPos = cnvsSize.top + 10 + i * height_per_rect;
        var leftPoint = new paper.Point(50, yPos);
        var rightPoint = new paper.Point(cnvsSize.right - 10, yPos);
        var aLine = new paper.Path.Line(leftPoint, rightPoint);
        aLine.strokeColor = '#999';
    }

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
    var bottomLeftPoint = new paper.Point(50 ,cnvsSize.bottom - 50);
    var topLeftPoint = new paper.Point(50, 10);
    var bottomRightPoint = new paper.Point(cnvsSize.right - 10,cnvsSize.bottom - 50);
    var aLine = new paper.Path.Line(bottomLeftPoint, bottomRightPoint)
    aLine.strokeColor = '#000';
    var aLine = new paper.Path.Line(bottomLeftPoint, topLeftPoint)
    aLine.strokeColor = '#000';

}

// Colors boxes where there are lines
function colorBoxes(nWide, nTall, cnvsSize, path, onOrOff) {
    // change to the grid layer:
    grid.activate();
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
    // for testing purposes:
    var txt = new PointText({point: new Point(60, 130)});
    // for each point in the path, see what box its in:
    if (path.segments.length > 1) { // protects against coloring a box due to a click
        for (i=0; i < path.segments.length; i++) {
            pt = [path.segments[i]["point"]["x"], path.segments[i]["point"]["y"]];
            if (onOrOff == 'on') {
                // if coloring the boxes:
                for (var j = 0; j < nWide; j++) {
                    for (var k = 0; k < nTall; k++) {
                        var rect = new paper.Path.Rectangle({
                            point: [j*rect_width + 50, k * rect_height + 10], 
                            size: [rect_width, rect_height]
                        });
                        if (rect.bounds.contains(pt)) {
                            rect.fillColor = '#50ffba';
                            rect.sendToBack(); // ensures boxes are behind grid lines
                        } else {
                            rect.remove();
                        }
                    }
                }
            } else {
                // delete the boxes via a hit test
                var hitResult = project.activeLayer.hitTest(pt, hitOptions);
                txt.content =  "pt: " + pt + "\nLayer: " + project.activeLayer + "\nhitResult: " +
                    hitResult + "  hitResult.item: " + hitResult.item + "\nParent: " + 
                    hitResult.item.parent + " parent of parent: " + hitResult.item.parent.parent;
                if (!hitResult)
                    continue;
                if (hitResult) {
                    // if (hitResult.type == 'fill') {
                        var rect = hitResult.item;
                        rect.remove();
                    // }
                }
            }
        }
    }
    // return to the canvas layer:
    cnvs.activate();
}