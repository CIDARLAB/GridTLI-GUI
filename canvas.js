// Make the paper scope global, by injecting it into window:
paper.install(window);
// Initialize List of tools
var drawLine, drawPoints, selectLine, deleteLines, appendPoints, movePoints;
// Initialize Graph values
var timeValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
var spatialValues = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
spatialValues.reverse() // graph writes top to bottom therefore reversed
var spatialDivs = 12;
var timeDivs = 16;

// Load the window
window.onload = function() {
    // Setup directly from canvas id:
    paper.setup('myCanvas');
    myCanvas.style.background = '#ccc'; 

    // initialize variables
    var segment, path;   
    var allPathsList = [];
    var pointList = [];
    var textItem = new PointText({
        content: 'Click and drag to draw a line.',
        point: new Point(60, 30),
        fillColor: 'black',
    });

    grid = new Layer();
    drawGrid(timeDivs, spatialDivs, timeValues, spatialValues, paper.view.bounds);

    cnvs = new Layer({
        children: path, allPathsList, pointList, textItem,	
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
                    // if path is a child in cnvs, select it
                    textItem.content = "cnvs!!!" + project.activeLayer + "\n" + hitResult.type;
                    path.selected = true;
                }
            }
        }
    }

    // Define tool to draw the whole line segment
    drawLine = new Tool();
    drawLine.onMouseDown = function(event) {
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            // deselect current path:
            var children = cnvs.children;
            for (i = 0; i < children.length; i++) {
                if (children[i].selected) {
                    path.selected = false;
                }
            }
            // Create a new path and set its stroke color to black:
            path = new Path({
                segments: [event.point],
                strokeColor: 'black',
                selected: true,
                // Select the path, so we can see its segment points:
                // fullySelected: true
            });
        }
    }

    // While the user drags the mouse, points are added to the path
    // at the position of the mouse:
    drawLine.onMouseDrag = function(event) {
        document.getElementById('xrange').value = path.segments.length;
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            numSegments = path.segments.length;
            if (event.point.x > path.segments[numSegments-1].point.x) {
                path.add(event.point)
                pointList.push(event.point.x, event.point.y);
                textItem.content = path.segments + "\n" + path.segments[0]["point"].x
            } else {
                return;
            }
        } 
    }

    // When the mouse is released:
    drawLine.onMouseUp = function(event) {
        project.activeLayer.addChild(path); // add path to the active layer
        // color the boxes where segments appear
        colorBoxes(timeDivs, spatialDivs, view.bounds, path, 'on');
        // path.selected = false; // deselect the current path
        allPathsList.push(pointList); // add pointList for current path to the allPathsList
        pointList = []; // reinitialize the pointList
        // for testing purposes, display all paths and latest path
        numPaths = allPathsList.length;
        textItem.content = allPathsList + "\n" + allPathsList[numPaths-1] + "\n";
    }


    // Define tool to draw points and connect them
    drawPoints = new Tool();
    drawPoints.onMouseDown = function(event) {
        /* the user can draw a line point-to-point if nothing is selected
           or the user can append to an existing line if already selected */

        // // for testing purposes:   
        // textItem.content = project.activeLayer.children + "\n" + project.selectedItems
        //     + "\n" + path + "\n" + project.getItems({selected:true});
        // limits use to within graph bounds
        if ((50 <= event.point.x) && (event.point.x <= 700) &&
        (10 <= event.point.y) && (event.point.y <= 460)) {
            // if nothing is selected, begin a new line:
            if (path.selected) {
                var currentChildren = project.activeLayer.children;
                for (i = 0; i < currentChildren.length; i++) {
                    if (currentChildren[i] == project.getItems({selected:true})[1]) {
                        path = project.activeLayer.children[i];
                        var pathOrder = i; // will be appended to existing path
                    }
                }
                textItem.content = "old path: " + path + " length: " + allPathsList.length;
            } else {
                path = new Path({
                    segments: [event.point],
                    strokeColor: 'black',
                    selected: true // select path to see segment points
                });
                if (allPathsList) {
                    var pathOrder = allPathsList.length; // will be added as new path
                } else {
                    var pathOrder = 0;
                }
                textItem.content = "new path: " + path + " order: " + pathOrder;
            }
            numSegments = path.segments.length;
            if (event.point.x > path.segments[numSegments-1].point.x) {
                path.add(event.point)
            } 
            // color the boxes where segments appear
            colorBoxes(timeDivs, spatialDivs, view.bounds, path, 'on');
            allPathsList[pathOrder].push(event.point.x, event.point.y); // modify pointList for current path to the allPathsList
            // for testing purposes, display all paths and latest path
            // numPaths = allPathsList.length;
            // textItem.content = allPathsList + "\n" + allPathsList[numPaths-1] + "\n";
        }
    }


    // Define tool for deleting lines
    deleteLines = new Tool();
    deleteLines.onMouseDown = function(event) {
        // Define the active layer:
        cnvs.activate();
        // textItem.content = project.activeLayer; // error checking
        // Check if a click lands on a line or not ("hit test")
        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult)
            return;
        if (hitResult) {
            path = hitResult.item;
            if (path.parent == project.activeLayer) {
                textItem.content = "cnvs!!!" + project.activeLayer + "\n" + hitResult.type;
                colorBoxes(timeDivs, spatialDivs, view.bounds, path, 'off');
                path.fullySelected = true;
                path.remove();
            }
        }
    }

    // Define tool for moving a single point on a line
    movePoints = new Tool();
    movePoints.onMouseDown = function(event) {
        segment = null;

        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult)
            return;

        // allows you to delete a segment when holding down "shift"
        if (event.modifiers.shift) {
            if (hitResult.type == 'segment') {
                hitResult.segment.remove();
            };
            return;
        }

        if (hitResult) {
            if (hitResult.type == 'segment') {
                segment = hitResult.segment;
            } else if (hitResult.type == 'stroke') {
                var location = hitResult.location;
                segment = path.insert(location.index + 1, event.point);
                path.smooth();
            }
	    }
        textItem.content = segment.point + " " + event.delta;
    }

    movePoints.onMouseDrag = function(event) {
        if (segment) {
            segment.point += event.delta;
            path.smooth();
        } else if (path) {
            path.position += event.delta;
        }
    }

    movePoints.onMouseUp = function(event) {
        colorBoxes(timeDivs, spatialDivs, view.bounds, path, 'on');
    }

    view.draw();
    drawLine.activate(); // begins with the pencil activated

}