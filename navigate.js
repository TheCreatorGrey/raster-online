var draggingView;

document.body.onmousemove = (event) => {
    if (draggingView) {
        let bounding = workarea.getBoundingClientRect()

        workarea.style.left = bounding.left + (event.clientX-draggingView[0]);
        workarea.style.top = bounding.top + (event.clientY-draggingView[1]);

        draggingView = [
            event.clientX,
            event.clientY
        ]
    }
}

document.body.onmousedown = (event) => {
    if (event.button === 1) {
        draggingView = [
            event.clientX,
            event.clientY
        ]
    }
}

document.body.onmouseup = () => {
    draggingView = null
}

document.body.onwheel = function (event) {  
    let bounding = workarea.getBoundingClientRect();
    let amount = event.deltaY/100;

    workarea.style.width = bounding.width - (canvasResolution[0]*amount);
    workarea.style.height = bounding.height - (canvasResolution[1]*amount);

    bounding = workarea.getBoundingClientRect();
    workarea.style.backgroundSize = `${bounding.width/canvasResolution[0]}px`;
}


function resizeFromInput(event, axis) {
    let value = event.target.value;
    value = Number(value);

    if (!value) {
        value = 16;
        event.target.value = "16";
    }

    canvasResolution[axis] = value
    adjustCanvas();
}

document.getElementById("canvasSize_x").onchange = (event) => {resizeFromInput(event, 0)};
document.getElementById("canvasSize_y").onchange = (event) => {resizeFromInput(event, 1)};