const workarea = document.getElementById("workarea");

const selectIndicator = document.getElementById("selectIndicator");
const moveIndicator = document.getElementById("moveIndicator");
const selectionContext = document.getElementById("selectMenu");

const canvas = document.getElementById("main");
const mainCtx = canvas.getContext("2d", { willReadFrequently: true });

const preview = document.getElementById("overlay");
const previewCtx = overlay.getContext("2d", { willReadFrequently: true });

// /\ /\ /\ /\
// There are two canvases.
// The "preview" canvas is where previews of new changes are drawn until they are finished
// When a change is finished, the contents of the preview canvas will be drawn to the "main" canvas applying it.
// This makes it so that the whole thing doesnt need to be redrawn every time a change is made. That would be inefficient.

// The "workarea" above is a div that holds both of the canvases to ensure they both align. This is the element that 
// is actually adjusted when zooming in or panning.


var canvasResolution = [16, 16]
function adjustCanvas() {
    canvas.width=canvasResolution[0];
    canvas.height=canvasResolution[1];
    overlay.width=canvasResolution[0];
    overlay.height=canvasResolution[1];
    workarea.style.width=canvasResolution[0]*40 + 'px';
    workarea.style.height=canvasResolution[1]*40 + 'px';
}

window.addEventListener("load", () => {
    adjustCanvas();

    let bounding = workarea.getBoundingClientRect()
    workarea.style.backgroundSize = `${bounding.width/canvasResolution[0]}px`
})


// "Box Indicator" refers to the rectangle overlays used for selection UI.
function updateBoxIndicator(indicator, left, top, right, bottom) {
    let corrected = correctRect(left, top, right, bottom)

    let left_percent = (corrected[0]/canvasResolution[0])*100
    let top_percent = (corrected[1]/canvasResolution[1])*100
    let right_percent = (corrected[2]/canvasResolution[0])*100
    let bottom_percent = (corrected[3]/canvasResolution[1])*100
    let width = right_percent - left_percent;
    let height = bottom_percent - top_percent

    indicator.style.left = left_percent + "%";
    indicator.style.top = top_percent + "%";
    indicator.style.width = width + "%";
    indicator.style.height = height + "%";
}





// When a user makes a change, it will be recorded here and applied to the canvas.
// This allows the user to undo changes all the way back to the first change.
// When a user undoes a change, the canvas will be cleared and every change except
// for the last will be re-rendered. 
var changeLog = [];

// Each change is stored as an array. Here's what that looks like:
// [change type, color, arguments]

// First item of a change represents its type.
// NUMBERING IS OUTDATED (I will update it later but im too lazy)
// 0 = Multi point line
// 1 = Erase
// 2 = 2-point line
// 3 = rectangle
// 4 = circle
// 5 = fill
// 6 = replace color
// 7 = clone selection
// 8 = filter
// 9 = image

// Some of them show up on the toolbar, some don't.
// To see these in code form, see tools.js

// Second item is RGBA color in the form of an array
// like [255, 255, 255, 1]

// Following items are specific to change type and represent "arguments"

var pendingChange;

// Stores coordinate values when the user makes a selection.
// first 2 are coordinates of top left of selection
// following 2 are of the bottom right
// last 2 items represent offset
var selection = [0, 0, 0, 0, 0, 0];
// 0 = no selection 1 = making selection 2 = active selection
var selectionStage = 0;




// Export stuff
function downloadFromUrl(url, filename) {
    let link = document.getElementById("saveLink");
    link.href = url;
    link.download = filename;
    link.click();
}

function save() {
    downloadFromUrl(canvas.toDataURL(), "ro_project.png")
}

// Export (selection) stuff
document.getElementById("exportSelection").onclick = () => {
    let exportCanvas = document.getElementById("exportCanvas");
    let exportCtx = exportCanvas.getContext("2d");

    let [startX, startY, endX, endY] = correctRect(...selection);

    let width = endX - startX;
    let height = endY - startY;

    exportCanvas.width = width;
    exportCanvas.height = height;

    let region = mainCtx.getImageData(
        startX, startY, 
        width, height
    );

    exportCtx.putImageData(region, 0, 0);
    downloadFromUrl(exportCanvas.toDataURL(), "ro_selection.png");
    exportCtx.clearRect(0, 0, width, height);
}




// When a change is made, it will be repeatedly drawn
// to the preview canvas. When it is done, the preview
// canvas will be drawn to the main canvas here
async function applyChanges() {
    await mainCtx.drawImage(preview, 0, 0)
    await previewCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);
}


// Renders a change in array form to a canvas
async function drawChange(c, log=true) {
    let type = c[0];
    let color = c[1];

    if (log) {
        changeLog.push(c)
    }

    await tools[type].draw(previewCtx, c)
}


// Redraws all changes
async function reRender() {
    await mainCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);

    for (let c of changeLog) {
        await drawChange(c, false);
        await applyChanges()
    }
}


function update() {
    // Updates the selection preview boxes if there is a selection
    if (selectionStage > 0) {
        moveIndicator.hidden = false
        selectIndicator.hidden = false

        updateBoxIndicator(
            moveIndicator, 
            selection[0], selection[1], 
            selection[2], selection[3]
        )

        updateBoxIndicator(
            selectIndicator, 
            selection[0]+selection[4], 
            selection[1]+selection[5],
            selection[2]+selection[4], 
            selection[3]+selection[5]
        )
    } else {
        moveIndicator.hidden = true
        selectIndicator.hidden = true
    }

    if (selectionStage === 2) {
        selectionContext.hidden = false

        let bounding = selectIndicator.getBoundingClientRect();
        selectionContext.style.left = bounding.right + "px";
        selectionContext.style.top = bounding.top + "px";
    } else {
        selectionContext.hidden = true
    }
}

setInterval(update, 10);




// ====================

let mouse = {
    x:0, y:0, 
    button:null,
    relativeTo:(element, multiply=[1, 1], round=true) => {
        let bounding = element.getBoundingClientRect();

        let posX = mouse.x;
        let posY = mouse.y;

        // Constraints
        if (posX < bounding.left) {
            posX = bounding.left
        }
        if (posY < bounding.top) {
            posY = bounding.top
        }
        if (bounding.right < posX) {
            posX = bounding.right
        }
        if (bounding.bottom < posY) {
            posY = bounding.bottom
        }
    
        posX -= bounding.left;
        posY -= bounding.top;
        
        posX /= bounding.width;
        posY /= bounding.height;
    
        posX *= multiply[0];
        posY *= multiply[1];
    
        if (round) {
            posX = Math.floor(posX);
            posY = Math.floor(posY);
        }
        
        return [posX, posY]
    },
    fromCenter:() => {
        return [
            mouse.x - (document.body.clientWidth/2),
            mouse.y - (document.body.clientHeight/2)
        ]
    }
};

//document.body.onpointermove = (event) => {
//    mouse.x = event.clientX;
//    mouse.y = event.clientY;
//};

document.body.onpointerdown = (event) => {
    mouse.button = event.button
};

// ====================



let toolID = 0;
document.body.onpointermove = async (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    // If the mouse is moving during an active change,
    // the change should be modified (e.g. the bottom right
    // corner of a rectangle should be updated to the mouse position)

    let [ posX, posY ] = mouse.relativeTo(workarea, canvasResolution);
    
    if (mouse.button === 0) {
        if (pendingChange) {
            let updateChange = tools[pendingChange[0]].update;
            if (updateChange) {
                updateChange(
                    pendingChange, posX, posY
                );

                await previewCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);
                await drawChange(pendingChange, false);
            }
        }
    }


    // If the selection is in the "shaping stage", update corner to mouse position
    if (selectionStage === 1) {
        //selection[0] = stroke[3][0];
        //selection[1] = stroke[3][1];
        selection[2] = posX+1;
        selection[3] = posY+1;
    }
};




// When the pointer is clicked on the canvas, initiate a new change
preview.onpointerdown = (event) => {
    mouse.button = event.button;

    let [ posX, posY ] = mouse.relativeTo(workarea, canvasResolution);

    switch (event.button) {
        // If the button is a left click, initiate a change based on the tool
        // selection (toolID)
        
        case 0:
            // The structure of every change is different, 
            // but they all have the same 2 first values. Type and color
            pendingChange = [toolID, cloneArray(strokeColor)]

            // The structure (or arguments) are defined in tools.js
            // Usually arguments contain values specific to the change, like coordinates.
            pendingChange.push(...tools[toolID].getStructure(posX, posY))


            // Get rid of selection when clicked off
            selectionStage = 0;

            break

        case 2:
            selection = [posX, posY, posX, posY, 0, 0]
            selectionStage = 1

            break
    }
}


selectIndicator.onpointerdown = (event) => {
    let [ posX, posY ] = mouse.relativeTo(workarea, canvasResolution);

    switch (event.button) {
        // If the button is a left click, initiate a change based on the tool
        // selection (toolID)
        
        case 0:
            pendingChange = [7, [0, 0, 0], selection, [posX, posY], [posX, posY]]

            break

        case 2:
            selectionStage = 1;

            break
    }
}


// When the mouse is released, it means the user is done
// drawing a line, rectangle or moving something.
// Since this change is finished, it can be added to the log
// and rendered to the main canvas.
document.body.onpointerup = async () => {
    mouse.button = null;

    if (pendingChange) {
        await drawChange(pendingChange);
        await applyChanges();

        pendingChange = null;
    }

    if (selectionStage === 1) {
        selectionStage = 2
    }
    if (selectionStage === 2) {
        selection[0] += selection[4]
        selection[1] += selection[5]
        selection[2] += selection[4]
        selection[3] += selection[5]

        selection[4] = 0
        selection[5] = 0
    }
}






// Keybinds and whatever
document.body.onkeydown = async (event) => {
    switch(event.key) {
        case "z":
            // Remove last change
            changeLog.pop()

            // Redraw
            reRender()

            break

        case "r":
            // Redraw
            reRender()

            break

        case "e":
            let [ posX, posY ] = mouse.relativeTo(workarea, canvasResolution);

            strokeColor = await getPixel(mainCtx, posX, posY);
            redrawPicker();

            break
    }
}