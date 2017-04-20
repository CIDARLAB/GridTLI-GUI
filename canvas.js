// Make the paper scope global, by injecting it into window:
paper.install(window);
// Initialize List of tools
var selectLine, drawLine, drawPoints, deleteLines, movePoints;
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

    // var cnvsKids = new PointText({
    //     content: 'hi', // cnvs.children.length,
    //     point: new Point(60, 400),
    //     fillColor: 'black',
    // });
    // var pathGroup = new Group();

    grid = new Layer();
    grid.removeChildren();

    gridGroup = drawGrid(timeDivs, spatialDivs, timeValues, spatialValues, paper.view.bounds);

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
        return; // prevents selectLine from drawing lines 
    }

    // Define tool for deleting lines
    deleteLines = new Tool();
    deleteLines.onMouseDown = function(event) {
        cnvs.activate(); // Define active layer:
        // textItem.content = project.activeLayer; // error checking
        // Check if a click lands on a line or not ("hit test")
        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult)
            return;
        if (hitResult) {
            path = hitResult.item;
            if (path.parent == project.activeLayer) {
                // textItem.content = "cnvs!!!" + project.activeLayer + "\n" + hitResult.type;
                path.fullySelected = true;
                path.remove();
                colorBoxes(timeDivs, spatialDivs, view.bounds, gridGroup, cnvs.children);
            }
        }
    }

    // Define tool to draw the whole line segment
    drawLine = new Tool();
    drawLine.onMouseDown = function(event) {
        cnvs.activate(); // Define active layer:
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
            path = new Path({ // creates a new path 
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
                // textItem.content = path.segments + "\n" + path.segments[0].point.x
            }
        } 
    }

    // When the mouse is released:
    drawLine.onMouseUp = function(event) {
        cnvs.addChild(path);
        // textItem.content = "cnvs children: " + cnvs.children;
        // project.activeLayer.addChild(path); // add path to the active layer
        // color the boxes where segments appear
        colorBoxes(timeDivs, spatialDivs, view.bounds, gridGroup, cnvs.children);
        // path.selected = false; // deselect the current path
        allPathsList.push(pointList); // add pointList for current path to the allPathsList
        pointList = []; // reinitialize the pointList
        // for testing purposes, display all paths and latest path
        numPaths = allPathsList.length;
        // textItem.content = allPathsList + "\n" + allPathsList[numPaths-1] + "\n";
        // textItem.content = "num segs: " + path.segments.length;
        // cnvsKids.content = "drawLine cnvs.children: " + cnvs.children + "\n" + cnvs.children.length;
    }


    // Define tool to draw points and connect them
    drawPoints = new Tool();
    drawPoints.onMouseDown = function(event) {
        /* the user can draw a line point-to-point if nothing is selected
           or the user can append to an existing line if already selected */

        // // for testing purposes:   
        // textItem.content = project.activeLayer.children + "\n" + project.selectedItems
        //     + "\n" + path + "\n" + project.getItems({selected:true});

        cnvs.activate(); // Define active layer:

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
                // textItem.content = "old path: " + path + " length: " + allPathsList.length;
            } else {
                path = new Path({
                    segments: [event.point],
                    strokeColor: 'black',
                    selected: true // select path to see segment points
                });
                cnvs.addChild(path);
                if (allPathsList) {
                    var pathOrder = allPathsList.length; // will be added as new path
                } else {
                    var pathOrder = 0;
                }
                // textItem.content = "new path: " + path + " order: " + pathOrder;
            }
            numSegments = path.segments.length;
            if (event.point.x > path.segments[numSegments-1].point.x) {
                path.add(event.point)
            } 
            // color the boxes where segments appear
            colorBoxes(timeDivs, spatialDivs, view.bounds, gridGroup, cnvs.children);
            allPathsList[pathOrder].push(event.point.x, event.point.y); // modify pointList for current path to the allPathsList
            // for testing purposes, display all paths and latest path
            // numPaths = allPathsList.length;
            // textItem.content = allPathsList + "\n" + allPathsList[numPaths-1] + "\n";
        }
    }

    drawPoints.onMouseDrag = function(event) {
        return; // prevents drawPoints from drawing continuous lines
    }

    drawPoints.onMouseUp = function(event) {
        for (i = 1; i < path.segments.length; i++) {
            path.segments[i-1].smooth();
            // i offset allows smoothing per segment without affecting the whole path
        }
    }


    // Define tool for moving a single point on a line
    movePoints = new Tool();
    movePoints.onMouseDown = function(event) {
        cnvs.activate(); // Define the active layer:

        segment = null;

        var hitResult = project.hitTest(event.point, hitOptions);

        // allows you to delete a segment when holding down "shift"
        if (event.modifiers.shift) {
            if (hitResult.type == 'segment') {
                hitResult.segment.remove();
            };
            return; // allows whole path to be moved while holding down shift
        }

        if (hitResult) {
            if (hitResult.item.parent == project.activeLayer) {
                if (hitResult.item.selected) {
                    if (hitResult.type == 'segment') {
                        segment = hitResult.segment;
                    } else if (hitResult.type == 'stroke') {
                        var location = hitResult.location;
                        segment = path.insert(location.index + 1, event.point);
                        segment.smooth(); // smooths only the strokes around the segment
                    }
                }
            }
	    }
    }

    movePoints.onMouseDrag = function(event) {
        if (segment) {
            // adding doesn't function properly using window scope, necessary to add manually
            segment.point.x = segment.point.x + event.delta.x;
            segment.point.y = segment.point.y + event.delta.y;
            segment.smooth(); // smooths only the strokes around the segment
        } else if (path) {
            path.position.x = path.position.x + event.delta.x;
            path.position.y = path.position.y + event.delta.y;
        }
    }

    movePoints.onMouseUp = function(event) {
        colorBoxes(timeDivs, spatialDivs, view.bounds, gridGroup, cnvs.children);
    }

    view.draw();
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