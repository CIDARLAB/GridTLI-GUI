// Make the paper scope global, by injecting it into window:
paper.install(window);
// Initialize List of tools
var selectLine, drawLine, drawPoints, deleteLines, movePoints;
// Initialize Graph values
var timeValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
var spatialValues = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
spatialValues.reverse() // graph writes top to bottom therefore reversed
var nSpatialDivs = 12;
var nTimeDivs = 16;
var spatialMin = -6;
var spatialMax = 6;
var timeMax = 16;

// Initialize Save/Output Array
var adjustedOutput;

// Load the window
window.onload = function() {
    // Setup directly from canvas id:
    paper.setup('myCanvas');
    myCanvas.style.background = '#ccc'; 

    // initialize variables
    var segment;
    var path = new Path();
    var allPathsList = [];
    var pointList = [];
    var textItem = new PointText({
        content: 'Click and drag to draw a line.',
        point: new Point(60, 30),
        fillColor: 'black',
    });
    
    grid = new Layer();
    grid.removeChildren();

    gridGroup = drawGrid(nTimeDivs, nSpatialDivs, timeValues, spatialValues, paper.view.bounds);

    cnvs = new Layer({
        children: path, // allPathsList, pointList, textItem, // pathGroup,
    });

    // defines hitOptions - used to check if a click lands on a line or not
    var hitOptions = {
        segments: true,
        stroke: true,
        fill: false,
        tolerance: 3
    };

    // Define tool to select a whole line segment
    selectLine = new Tool();
    selectLine.onMouseDown = function(event) {
        cnvs.activate(); // Define active layer:
        // textItem.content = "grid: " + gridGroup.children.length;
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            var children = cnvs.children; // get all paths
            for (i = 0; i < children.length; i++) {
                if (children[i].selected == true) {
                    path.selected = false; // if any paths are selected, deselect them
                }
            }
            var hitResult = project.hitTest(event.point, hitOptions); // hit test
            if (hitResult) {
                path = hitResult.item;
                if (path.parent == project.activeLayer) {
                    // textItem.content = "cnvs!!!" + project.activeLayer + path + "\n" + hitResult.type;
                    path.selected = true; // if path is child in cnvs, select it
                }
            } 
        }
    }

    selectLine.onMouseDrag = function(event) {
        return; // prevents selectLine from drawing continuous lines 
    }

    // Define tool for deleting lines
    deleteLines = new Tool();
    deleteLines.onMouseDown = function(event) {
        cnvs.activate(); // Define active layer:
        var hitResult = project.hitTest(event.point, hitOptions); // check if click is on a line
        if (!hitResult)
            return;
        if (hitResult) {
            path = hitResult.item;
            idx = hitResult.item.index;
            if (path.parent == project.activeLayer) {
                allPathsList.splice(idx,1);
                path.fullySelected = true;
                path.remove();
                colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children);
            }
        }
        // textItem.content = allPathsList + "\n" + allPathsList.length + "\n" + cnvs.children.length;
    }

    // Define tool to draw the whole line segment
    drawLine = new Tool();
    drawLine.onMouseDown = function(event) {
        cnvs.activate(); // Define active layer:
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            var children = cnvs.children;
            for (i = 0; i < children.length; i++) {
                if (children[i].selected) {
                    path.selected = false; // if path is selected, deselect it
                }
            }
            path = new Path({ // create a new path 
                segments: [event.point],
                strokeColor: 'black',
                selected: true
            });
        }
    }

    // While the user drags the mouse, points are added to the path
    // at the position of the mouse:
    drawLine.onMouseDrag = function(event) {
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            numSegments = path.segments.length;
            if (event.point.x > path.segments[numSegments-1].point.x) {
                path.add(event.point)
                pointList.push(event.point.x, event.point.y);
                // textItem.content = pointList; // path.segments + "\n" + path.segments[0].point.x
            }
        } 
    }

    // When the mouse is released:
    drawLine.onMouseUp = function(event) {
        cnvs.addChild(path);
        // textItem.content = "cnvs children: " + cnvs.children;
        // color the boxes where segments appear
        // textItem.content = "ao prior1: " + adjustedOutput + "\nt: " +
        //     nTimeDivs + ", s: " + nSpatialDivs + "\nbounds: " + view.bounds + "\nkids: " + 
        //     cnvs.children.length + " gridlength: " + gridGroup.children.length;

        colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children);
        // textItem.content = "ao prior2: " + adjustedOutput;

        // path.selected = false; // deselect the current path
        allPathsList.push(pointList); // add pointList for current path to the allPathsList
        pointList = []; // reinitialize the pointList

        // for testing purposes, display all paths and latest path        
        numPaths = allPathsList.length;
        // textItem.content = allPathsList + "\n" + allPathsList[numPaths-1] + "\n" + allPathsList[numPaths-1][0];
        // textItem.content = "num segs: " + path.segments.length;
        // adjustedOutput = new Array();
        // textItem.content = "ao prior3: " + adjustedOutput;
        var adjustedOutput = changePathValues(allPathsList, timeMax, spatialMin, spatialMax);
        textItem.content = "a0: " + adjustedOutput.length + "\n" + adjustedOutput[numPaths - 1];
    }


    // Define tool to draw points and connect them
    drawPoints = new Tool();
    drawPoints.onMouseDown = function(event) {
        /* the user can draw a line point-to-point if nothing is selected
           or the user can append to an existing line if already selected */

        cnvs.activate(); // Define active layer:
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            if (path.selected) { // if path is selected, find which one for allPathsList:
                var currentChildren = project.activeLayer.children;
                for (i = 0; i < currentChildren.length; i++) {
                    if (currentChildren[i] == project.getItems({selected:true})[1]) {
                        path = project.activeLayer.children[i];
                        var pathOrder = i; // will be appended to existing path
                    }
                }
                // textItem.content = "old path: " + path + " length: " + allPathsList.length;
            } else { // if no path is selected, create a new one:
                path = new Path({
                    segments: [event.point],
                    strokeColor: 'black',
                    selected: true // select path to see segment points
                });
                if (allPathsList) {
                    var pathOrder = allPathsList.length; // will be added as additional path
                } 
                else {
                    var pathOrder = 0;
                }
                // textItem.content = "new path: " + path + " order: " + pathOrder;
            }

            numSegments = path.segments.length;
            if (event.point.x > path.segments[numSegments - 1].point.x) {
                path.add(event.point)
                pointList.push(event.point.x, event.point.y)
            } 
            // color the boxes where segments appear
            colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children);
            // textItem.content = pathOrder + event.point.x + event.point.y + "\n" + allPathsList +
            //  "\n" + allPathsList[pathOrder];
            allPathsList[pathOrder].push(pointList);
            // for testing purposes, display all paths and latest path
            // numPaths = allPathsList.length;
            // textItem.content = pathOrder + "\n" + allPathsList + "\n" + allPathsList[numPaths-1] + "\n";
        }
    }

    drawPoints.onMouseDrag = function(event) {
        return; // prevents drawPoints from drawing continuous lines
    }

    drawPoints.onMouseUp = function(event) {
        // cnvs.addChild(path);
        for (i = 1; i < path.segments.length; i++) {
            path.segments[i-1].smooth();
            // i offset allows smoothing per segment without affecting the whole path
        }
        // allPathsList[pathOrder].push(event.point.x, event.point.y); // modify the pathList for the current path
        
    }

    // Define tool for moving a single point on a line
    movePoints = new Tool();
    movePoints.onMouseDown = function(event) {
        cnvs.activate(); // Define the active layer:
        segment = path = idx = null;;
        var hitResult = project.hitTest(event.point, hitOptions);
        // allows you to delete a segment when holding down "shift"
        if (event.modifiers.shift) {
            if (hitResult.type == 'segment') {
                hitResult.segment.remove();
            };
            return;
        }
        if (hitResult) {
            if (hitResult.item.parent == project.activeLayer) {
                if (hitResult.item.selected) {
                    path = hitResult.item;
                    path.fullySelected = true;
                    if (hitResult.type == 'segment') {
                        segment = hitResult.segment;
                        idx = hitResult.segment.index;
                        // textItem.content = "seg index: " + idx;
                        // textItem.content = "seg - 1: " + path.segments[idx - 1].point.x  + ", " + path.segments[idx-1].point.y +
                        // "\nseg + 1: " + path.segments[idx+1].point.x + ", " + path.segments[idx+1].point.y +
                        // "\n" + hitResult.item + " " + path;
                    } else if (hitResult.type == 'stroke') {
                        // idx = hitResult.segment.index;
                        // path.curve[idx-1].handle1
                        var location = hitResult.location;
                        segment = path.insert(location.index + 1, event.point);

                        segment.smooth(); // smooths only the strokes around the segment
                    }
                }
            }
	    }
    }

    movePoints.onMouseDrag = function(event) {
        // stores original segment coordinates
        origx = segment.point.x;
        origy = segment.point.y;
        idx = segment.index;
        // textItem.content = path + " s: " + segment.index + " idx: " + idx;

        
        if (segment) {
            // segment.fullySelected = true;
            // adding doesn't function properly using window scope, necessary to add manually
            segment.point.x = segment.point.x + event.delta.x;
            segment.point.y = segment.point.y + event.delta.y;
            // textItem.content = path;
            if ((segment.point.x < path.segments[idx+1].point.x - 2) &&
            (segment.point.x > path.segments[idx-1].point.x + 2)) {
                textItem.content = " ";
                // "Your line is a function." + "\n" +
                // path.curves[idx-1].bounds + "\n" + path.curves[idx].bounds;
                
                // for segment index = 2, the curves are 1 and 2;
                // for segment index = 5, the curves are 4 and 5;
                // path.segments[idx].strokeColor = 'black';
                // path.segments[idx].selectedColor = null;
            } else {
                textItem.content = "Your line is no longer a function." 
                // + "\n" +
                // "current: " + segment.point.x + ", " + segment.point.y +
                // "borders: " + path.segments[idx-1].point.x + " to " + path.segments[idx+1].point.x;
                segment.point.x = origx; // limits x coordinate within boundaries
                // segment.point.y = origy;
                // path.segments[idx].strokeColor = 'red';
                // path.segments[idx].selectedColor = 'red';
            }
            segment.smooth(); // smooths only the strokes around the segment
            // textItem.content = "handle1: " + path.curves[idx-1].handle1 + "\nhandle2: " + path.curves[idx-1].handle2 +
            // "\nhandle1: " + path.curves[idx].handle1 + "\nhandle2: " + path.curves[idx].handle2;;
            // path.curves[idx-1].bounds.x = path.segments[idx-1].point.x + 5;
            // path.curves[idx].bounds.width = path.segments[idx+1].point.x - segment.point.x - 5;
            // textItem.content = "previous: " + origx + ", " + origy + "\ncurrent: " + segment.point.x + ", " + segment.point.y;
            // "\nleft: " + path.segments[idx-1].point.x + " right: " + path.segments[idx+1].point.x;
        } else if (path) {
            path.position.x = path.position.x + event.delta.x;
            path.position.y = path.position.y + event.delta.y;
        }
    }
    
    movePoints.onMouseUp = function(event) {
        colorBoxes(nTimeDivs, nSpatialDivs, view.bounds, gridGroup, cnvs.children);
        dif1 = path.segments[idx].point.x - path.segments[idx - 1].point.x;
        while (dif1 < path.curves[idx - 1].bounds.width) {
            path.curves[idx - 1].handle2.x = path.curves[idx - 1].handle2.x + 0.5;
            if (path.curves[idx - 1].handle2.x == 1) 
                break;
        }
        dif2 = path.segments[idx + 1].point.x - path.segments[idx].point.x;
        while (dif2 < path.curves[idx].bounds.width) {
            path.curves[idx].handle1.x = path.curves[idx].handle1.x - 0.5;
            if (path.curves[idx - 1].handle2.x == -1) 
                break;
        }
        // path.curves[idx-1].bounds.width = dif;
        textItem.content = path.segments[idx + 1].point.x + " - " + path.segments[idx].point.x +
        " = " + dif2 + "\n" + path.curves[idx].bounds.width
        // segment.smooth(); // smooths only the strokes around the segment
        // path.curves[idx-1].handle2 = [0,1];
        path.fullySelected = false;
        path.selected = true;
        path.fullySelected = true;
        // path.selected = true;
        // path.curves[idx-1].bounds.x = path.segments[idx-1].point.x + 5;
        // path.curves[idx].bounds.width = path.segments[idx+1].point.x - segment.point.x - 5;
    }

    drawLine.activate(); // begins with the pencil activated

}

// part of the infrastructure to implement keyboard shortcuts for tool selection?
        // if (event.modifiers.s) {
        //    selectLine.activate();
        //    document.getElementById("select").checked = true;
        //    document.getElementById("pencil").checked = false;
        //    document.getElementById("segment").checked = false;
        //    document.getElementById("eraser").checked = false;
        //    document.getElementById("move").checked = false;
        // }