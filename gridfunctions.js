function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = round((i*b+(n-i)*a)/n, 2); }
    return ret;
}

function changeValues(){
    // delete previous grid and reinitialize
    grid.remove();
    grid = new Layer();

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
    // reactivate the drawing canvas
    // cnvs.activate();
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