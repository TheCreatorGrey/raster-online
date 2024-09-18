const workarea = document.getElementById("workarea")

const canvas = document.getElementById("main");
const mainCtx = canvas.getContext("2d", { willReadFrequently: true });

const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d", { willReadFrequently: true });

// /\ /\ /\ /\
// There are two canvases.
// The "overlay" canvas is where previews of new changes are drawn until they are finished
// When a change is finished it will finally be drawn to the "main" canvas.
// This makes it so that the whole thing doesnt need to be redrawn every time a change is made. This is inefficient.

// The "workarea" above is a div that holds both of the canvases to ensure they both align. This is the element that 
// is actually adjusted when zooming in or panning.


var canvasResolution = [16, 16]
function adjustCanvas() {
    canvas.width=canvasResolution[0];
    canvas.height=canvasResolution[1];
    overlay.width=canvasResolution[0];
    overlay.height=canvasResolution[1];
    workarea.style.width=canvasResolution[0]*40;
    workarea.style.height=canvasResolution[1]*40;
}
adjustCanvas()

let bounding = workarea.getBoundingClientRect()
workarea.style.backgroundSize = `${bounding.width/canvasResolution[0]}px`




// add filters
function filter(x, y, color, mode) {
    switch (mode) {
        // Lighten filter
        case 0:
            return [color[0]+10, color[1]+10, color[2]+10, color[3]]

        // Darken filter
        case 1:
            return [color[0]-10, color[1]-10, color[2]-10, color[3]]

        // Stipple filter
        case 2:
            let alpha = color[3];

            // you may want to improve this code later (it sucks)
            if (x % 2 && !(y % 2)) {
                alpha = 0
            }
            if ((x-1) % 2 && !((y-1) % 2)) {
                alpha = 0
            }

            return [color[0], color[1], color[2], alpha]
        
        // Noise filter
        case 3:
            rdm = 5 * (Math.random()-.5)

            return [color[0]+rdm, color[1]+rdm, color[2]+rdm, color[3]];

        // Clear filter
        case 4:
            return [0, 0, 0, 0];

        default:
            return [color[0], color[1], color[2], color[3]]
    }
}



// When a user makes a change, it will be recorded here and applied to the canvas.
// This allows the user to undo changes all the way back to the first change.
// When a user undoes a change, the canvas will be cleared and every change except
// for the last will be re-rendered. 
var changeLog = [];

// Each change is stored as an array. Here's what that looks like:
// [change type, color, arguments]

// First item of a change represents its type.
// 0 = Multi point line
// 1 = 2 point line
// 2 = rectangle
// 3 = filter
// 4 = color fill
// 5 = color replace
// 6 = selection
// 8 = image

// Second item is RGBA color in the form of an array
// like [255, 255, 255, 1]

// Following items are specific to change type and represent "arguments"

var pendingChange;

// When a selection to move a region of pixels
// is made, the information will be stored here.
// first 2 are coordinates of top left of selection
// following 2 are of the bottom right
// last 2 items represent offset
var selection = [0, 0, 0, 0, 0, 0]; 
var selectionExists = false;

function save() {
    let link = document.createElement("a");
    document.body.appendChild(link);
    link.setAttribute("type", "hidden");
    link.href = canvas.toDataURL();
    link.download = "project.png";
    link.click();  
    document.body.removeChild(link);
}


// Renders a change in array form to a canvas
async function applyChange(context, c) {
    let type = c[0];
    let color = c[1];

    switch (type) {
        // Change is a multi-point line (0)
        case 0:
            let lines = c[2];
            let lastPos;

            for (var l of lines) {
                if (lastPos) {
                    drawLine(
                        context,
                        lastPos[0], lastPos[1],
                        l[0], l[1],
                        color
                    )
                }

                lastPos = l
            }

            break



        // Change is a line (1)
        case 1:
            let p1 = c[2];
            let p2 = c[3];

            drawLine(
                context,
                p1[0], p1[1],
                p2[0], p2[1],
                color
            )

            break



        // Change is a rectangle (2)
        case 2:
            let top = c[2][1];
            let bottom = c[3][1];
            let left = c[2][0];
            let right = c[3][0];

            drawRect(
                context, 
                [left, top], 
                [right, bottom],
                color
            )

            break



        // Change is a filter (3)
        case 3:
            let startX = c[3][0];
            let startY = c[3][1];

            let endX = c[4][0];
            let endY = c[4][1];

            // If rect is inverted, correct coordinates
            if (endY < startY) {
                let s = startY
                startY = endY
                endY = s
            }
            if (endX < startX) {
                let s = startX
                startX = endX
                endX = s
            }

            endY += 1
            endX += 1

            if (context === mainCtx) {
                for (let x=startX; x < endX; x++) {
                    for (let y=startY; y < endY; y++) {
                        let currentColor = getPixel(context, x, y);
                        
                        let newColor = filter(
                            x, y, 
                            currentColor,
                            c[2]
                        );
        
                        putPixel(
                            context,
                            x, y, 
                            newColor,
                            true
                        )
                    }
                }
            } else { // Region preview
                drawRect(
                    context, 
                    [startX, startY], 
                    [endX-1, endY-1],
                    [255, 0, 255, .5]
                )
            }

            break



        // Change is a fill (4)
        case 4:
            let fillQueue = [];
            let filled = [];

            let start = c[2];
            let targetColor = getPixel(mainCtx, start[0], start[1]);

            fillQueue.push([start[0], start[1]])


            while (fillQueue.length > 0) {
                let point = fillQueue[0];
                let x = point[0];
                let y = point[1];

                // Remove item from queue
                fillQueue.shift()

                // Ignore if point is outside of canvas
                if (x < 0) {
                    continue
                } else if (canvasResolution[0] < x) {
                    continue
                } else if (y < 0) {
                    continue
                } else if (canvasResolution[1] < y) {
                    continue
                }

                // Ignore if point has already been filled
                if (filled.includes(`${x}/${y}`)) {
                    continue
                }
                
                let pointColor = getPixel(mainCtx, x, y);

                // If color is an exact match, change pixel and continue
                if (
                    (pointColor[0] === targetColor[0]) && 
                    (pointColor[1] === targetColor[1]) && 
                    (pointColor[2] === targetColor[2]) && 
                    (pointColor[3] === targetColor[3])
                ) {
                    putPixel(mainCtx, x, y, color);
                    filled.push(`${x}/${y}`)

                    fillQueue.push([x+1, y]) // Add surrounding points to be checked
                    fillQueue.push([x-1, y])
                    fillQueue.push([x, y+1])
                    fillQueue.push([x, y-1])
                }
            }

            break


        // Change is a color replacement (5)
        case 5:
            let toReplace = c[2];

            for (let x=0; x < canvasResolution[0]; x++) {
                for (let y=0; y < canvasResolution[1]; y++) {
                    let originalColor = getPixel(mainCtx, x, y);
    
                    if (
                        (originalColor[0] === toReplace[0]) && 
                        (originalColor[1] === toReplace[1]) && 
                        (originalColor[2] === toReplace[2]) && 
                        (originalColor[3] === toReplace[3])
                    ) {
                        putPixel(mainCtx, x, y, color);
                    }
                }
            }

            break


        // Change is selection and move (6)
        case 6:
            let stage = c[2]

            if (stage === 0) {
                selection[0] = c[3][0];
                selection[1] = c[3][1];
                selection[2] = c[4][0];
                selection[3] = c[4][1];
            } else {
                let startX = selection[0];
                let startY = selection[1];
    
                let endX = selection[2];
                let endY = selection[3];

                // If rect is inverted, correct coordinates
                if (endY < startY) {
                    let s = startY
                    startY = endY
                    endY = s
                }
                if (endX < startX) {
                    let s = startX
                    startX = endX
                    endX = s
                }

                endX += 1;
                endY += 1;

                let offset = [selection[4], selection[5]];
    
                for (let x=startX; x < endX; x++) {
                    for (let y=startY; y < endY; y++) {
                        let pixel = getPixel(context, x, y);
                        
                        //putPixel(context, x, y, [0, 0, 0, 0], true);
                        putPixel(context, x+offset[0], y+offset[1], pixel, true);
                    }
                }
            }

            break


        // Change is a circle (7)
        case 7:
            function distance(p1, p2) {
                return Math.sqrt(
                    ((p2[0] - p1[0])**2) + 
                    ((p2[1] - p1[1])**2)
                )
            }

            let center = c[2];
            let edge = c[3];
            let radius = Math.ceil(distance(center, edge));

            for (let x=center[0]-radius; x < center[0]+radius; x++) {
                for (let y=center[1]-radius; y < center[1]+radius; y++) {
                    let distanceFromCenter = Math.round(distance(center, [x, y]))

                    if (distanceFromCenter < radius) {
                        putPixel(context, x, y, color)
                    }
                }
            }

            break


        // Change is an image (8)
        case 8:
            let position = c[2];
            let image = c[3];

            context.drawImage(image, position[0], position[1])

            break
    }
}


// Redraws all changes
function reRender() {
    mainCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);

    for (let c of changeLog) {
        applyChange(mainCtx, c)
    }
}


function update() {
    overlayCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);

    if (pendingChange) {
        applyChange(overlayCtx, pendingChange)
    }

    if (selectionExists) {
        drawRect(
            overlayCtx,
            [
                selection[0],
                selection[1]
            ],
            [
                selection[2],
                selection[3]
            ],
            [255, 150, 100, .5]
        )
    
        drawRect(
            overlayCtx,
            [
                selection[0]+selection[4],
                selection[1]+selection[5]
            ],
            [
                selection[2]+selection[4],
                selection[3]+selection[5]
            ],
            [100, 100, 255, .5]
        )
    }
}

setInterval(update, 10);



let toolID = 0;
let filterMode = 0;
workarea.onmousemove = (event) => {
    // If the mouse is moving during an active change,
    // the change should be modified (e.g. the bottom right
    // corner of a rectangle should be dragged to the mouse position)
    
    if (pendingChange) {
        let mp = mousePositionFromEvent(event, workarea, canvasResolution);
        let posX = mp[0];
        let posY = mp[1];

        stroke = pendingChange;
        let type = stroke[0];

        switch (type) {
            case 0:
                stroke[2].push([posX, posY])
                break

            case 1:
                stroke[3][0] = posX;
                stroke[3][1] = posY
                break

            case 2:
                stroke[3][0] = posX;
                stroke[3][1] = posY
                break

            case 3:
                stroke[4][0] = posX;
                stroke[4][1] = posY
                break

            case 6:
                // There are two stages of a selection
                // stage 0 refers to the selection area being dragged out
                // stage 1 is when that selection is moved

                let stage = stroke[2]

                if (stage === 0) {
                    stroke[4][0] = posX;
                    stroke[4][1] = posY;

                    selection[0] = stroke[3][0];
                    selection[1] = stroke[3][1];
                    selection[2] = stroke[4][0];
                    selection[3] = stroke[4][1];
                } else {
                    let initial = stroke[3];

                    // Set offset of selection to mouse position (moving selection)
                    stroke[4][0] = posX-initial[0];
                    stroke[4][1] = posY-initial[1];
                    
                    // Update visualisation to match actual selection
                    selection[4] = stroke[4][0];
                    selection[5] = stroke[4][1];
                }

                break

            case 7:
                stroke[3][0] = posX;
                stroke[3][1] = posY;
                break
        }
    }
};




// When the mouse is pressed, a new change is being initiated.
workarea.onmousedown = (event) => {
    let mp = mousePositionFromEvent(event, workarea, canvasResolution);
    let posX = mp[0];
    let posY = mp[1];

    switch (event.button) {
        // If the button is a left click, initiate a change based on the tool
        // selection (toolID)
        case 0:
            // The structure of every change is different, 
            // but they all have the same 2 first values. Type and color
            let newStroke = [
                toolID, 
                [
                    strokeColor[0], 
                    strokeColor[1], 
                    strokeColor[2], 
                    strokeColor[3]
                ]
            ];
            let params;
        
            
            // Every change is stored as an array.
            // The structure will be defined here, and modified above in the onmousemove area.
            // They contain values specific to the change, usually coordinate and color values.

            // Make sure your IDE uses a monospace font (most do), otherwise the below comments wont be aligned
            switch (toolID) {
                case 0:
                    // multi point line (draw)
                    //        \/ array of points (to be changed)
                    params = [[]]
                    break
        
                case 1:
                    // 2 point line (straight line)
                    //         \/ start     \/ end (to be changed)
                    params = [[posX, posY], [posX, posY]]
                    break
        
                case 2:
                    // rectangle
                    //        \/ top left   \/ bottom right (to be changed)
                    params = [[posX, posY], [posX, posY]]
                    break
        
                case 3:
                    // filter
                    //       \/ given     \/ top left   \/ bottom right (to be changed)
                    params = [filterMode, [posX, posY], [posX, posY]]
                    break

                case 4:
                    // fill
                    //       \/ point in area to fill
                    params = [[posX, posY]]
                    break

                case 5:
                    // color replacement
                    //       \/ color to replace
                    params = [getPixel(mainCtx, posX, posY)]
                    break

                case 6:
                    // selection
                    if (selectionExists) {
                        // stage \/  \/ initial    \/ offset (to be changed)
                        params = [1, [posX, posY], [posX, posY]] // Append offset change
                    } else {
                        // stage \/  \/ top left   \/ bottom right (both to be changed)
                        params = [0, [posX, posY], [posX, posY]]; // Append selection initialization change
                        selectionExists = true
                    }
                    
                    break

                case 7:
                    // circle / ellipse
                    //        \/ top left   \/ bottom right (to be changed)
                    params = [[posX, posY], [posX, posY]]
                    break
            }
            
            newStroke.push(...params) // Add parameters to the change array

            // In the below mouseup event, it will detect that a new change has been made and draw it
            pendingChange = newStroke

            break


        case 2: // This makes the right click behave like an eyedropper tool
            strokeColor = getPixel(mainCtx, posX, posY);
            redrawPicker();
            break
    }
}


// When the mouse is released, it means the user is done
// drawing a line, rectangle or moving something.
// Since this change is finished, it can be added to the log
// and rendered to the main canvas.
workarea.onmouseup = () => {
    if (pendingChange) {
        applyChange(mainCtx, pendingChange)
        changeLog.push(pendingChange)

        if (pendingChange[0] === 6) {
            if (pendingChange[2] === 1) {
                selection = [0, 0, 0, 0, 0, 0];
                selectionExists = false;
            }
        }

        pendingChange = null;
    }
}






// For now, the only function of this is to detect when the "z"
// key is pressed and undoes a change
document.body.onkeydown = (event) => {
    switch(event.key) {
        case "z":
            // Remove last change
            changeLog.pop()
            // Redraw
            reRender()
    }
}