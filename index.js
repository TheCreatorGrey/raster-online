const workarea = document.getElementById("workarea")

const canvas = document.getElementById("main");
const mainCtx = canvas.getContext("2d", { willReadFrequently: true });

const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");


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
        // Stroke is a multi-point line (0)
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



        // Stroke is a line (1)
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



        // Stroke is a rectangle (2)
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



        // Stroke is a filter (3)
        case 3:
            let startX = c[3][0];
            let startY = c[3][1];

            let endX = c[4][0]+1;
            let endY = c[4][1]+1;

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



        // Stroke is a fill (4)
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


        // Stroke is a color replacement (5)
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


        // Stroke selection and move (6)
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
    
                let endX = selection[2]+1;
                let endY = selection[3]+1;

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


        // Stroke is an image (8)
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

setInterval(update, 10);



let toolID = 1;
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
                let stage = stroke[2]

                if (stage === 0) {
                    stroke[4][0] = posX;
                    stroke[4][1] = posY;

                    selection[0] = stroke[3][0];
                    selection[1] = stroke[3][1];
                    selection[2] = stroke[4][0];
                    selection[3] = stroke[4][1];
                } else {
                    stroke[3][0] = posX-selection[2];
                    stroke[3][1] = posY-selection[3];

                    selection[4] = posX-selection[2];
                    selection[5] = posY-selection[3];
                }
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
        
        
            switch (toolID) {
                case 0:
                    params = [[]]
                    break
        
                case 1:
                    params = [[posX, posY], [posX, posY]]
                    break
        
                case 2:
                    params = [[posX, posY], [posX, posY]]
                    break
        
                case 3:
                    params = [filterMode, [posX, posY], [posX, posY]]
                    break

                case 4:
                    params = [[posX, posY]]
                    break

                case 5:
                    params = [getPixel(mainCtx, posX, posY)]
                    break

                case 6:
                    if (selectionExists) {
                        params = [1, [posX, posY]] // Append offset change
                    } else {
                        params = [0, [posX, posY], [posX, posY]]; // Append selection initialization change
                        selectionExists = true
                    }
                    
                    break
            }
            
            newStroke.push(...params)
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