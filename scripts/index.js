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

function save() {
    let link = document.createElement("a");
    document.body.appendChild(link);
    link.setAttribute("type", "hidden");
    link.href = canvas.toDataURL();
    link.download = "project.png";
    link.click();  
    document.body.removeChild(link);
}


// When a change is made, it will be repeatedly drawn
// to the preview canvas. When it is done, the preview
// canvas will be drawn to the main canvas here
function applyChanges() {
    mainCtx.drawImage(preview, 0, 0)
}


// Renders a change in array form to a canvas
async function drawChange(context, c, log=true) {
    let type = c[0];
    let color = c[1];

    if (log) {
        changeLog.push(pendingChange)
    }

    tools[type].draw(previewCtx, c)
}


// Redraws all changes
function reRender() {
    mainCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);

    for (let c of changeLog) {
        drawChange(mainCtx, c, false)
    }

    applyChanges()
}


function update() {
    // Clear preview
    previewCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1]);

    if (pendingChange) {
        drawChange(previewCtx, pendingChange, false);
    }

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
        selectionContext.style.left = bounding.right + "px"
        selectionContext.style.top = bounding.top + "px"
    } else {
        selectionContext.hidden = true
    }
}

setInterval(update, 10);



let toolID = 0;
workarea.onmousemove = (event) => {
    // If the mouse is moving during an active change,
    // the change should be modified (e.g. the bottom right
    // corner of a rectangle should be updated to the mouse position)

    let mp = mousePositionFromEvent(event, workarea, canvasResolution);
    let posX = mp[0];
    let posY = mp[1];
    
    if (event.button === 0) {
        if (pendingChange) {
            let updateChange = tools[pendingChange[0]].update;
            if (updateChange) {
                updateChange(
                    pendingChange, posX, posY
                );
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




// When the mouse is pressed, a new change is being initiated.
preview.onmousedown = (event) => {
    let mp = mousePositionFromEvent(event, workarea, canvasResolution);
    let posX = mp[0];
    let posY = mp[1];

    switch (event.button) {
        // If the button is a left click, initiate a change based on the tool
        // selection (toolID)
        
        case 0:
            // The structure of every change is different, 
            // but they all have the same 2 first values. Type and color
            pendingChange = [toolID, strokeColor]

            // The structure (or arguments) are defined in tools.js
            // Usually arguments contain values specific to the change, like coordinates.
            pendingChange.push(...tools[toolID].getStructure(posX, posY))


            // Get rid of selection when clicked off
            selectionStage = 0;

            break

        case 2:
            selection = [posX, posY, posX, posY, 0, 0]
            selectionStage = 1

            //strokeColor = getPixel(mainCtx, posX, posY);
            //redrawPicker();
            break
    }
}


selectIndicator.onmousedown = (event) => {
    let mp = mousePositionFromEvent(event, workarea, canvasResolution);
    let posX = mp[0];
    let posY = mp[1];

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
workarea.onmouseup = () => {
    if (pendingChange) {
        drawChange(mainCtx, pendingChange);
        applyChanges();

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