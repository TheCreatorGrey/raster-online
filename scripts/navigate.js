var draggingView = false;
var canvasPosition = [0, 0];
var canvasZoom = 1;
var previousMouse = [0, 0];



function updateCanvasPosition() {
    workarea.style.left = canvasPosition[0] + ((document.body.clientWidth/2)-(workarea.clientWidth/2)) + "px";
    workarea.style.top = canvasPosition[1] + ((document.body.clientHeight/2)-(workarea.clientHeight/2)) + "px";
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
    updateCanvasPosition()
    reRender()
}

window.addEventListener("load", () => {
    updateCanvasPosition()

    document.body.onmousemove = (event) => {
        if (draggingView) {
            canvasPosition[0] += (event.clientX - previousMouse[0]);
            canvasPosition[1] += (event.clientY - previousMouse[1]);

            previousMouse = [event.clientX, event.clientY];
            
            updateCanvasPosition()
        }
    }

    document.body.onmousedown = (event) => {
        previousMouse = [event.clientX, event.clientY]

        if (event.button === 1) {
            draggingView = true
        }
    }

    document.body.onmouseup = () => {
        draggingView = false
    }

    document.body.onwheel = function (event) {
        let bounding = workarea.getBoundingClientRect();
        let amount = event.deltaY/100;

        canvasZoom = 1-(amount/10)

        workarea.style.width = bounding.width * canvasZoom + "px";
        workarea.style.height = bounding.height * canvasZoom + "px";

        bounding = workarea.getBoundingClientRect();
        workarea.style.backgroundSize = bounding.width/canvasResolution[0] + "px";

        canvasPosition[0] = canvasPosition[0] + (-canvasPosition[0] * (1 - canvasZoom))
        canvasPosition[1] = canvasPosition[1] + (-canvasPosition[1] * (1 - canvasZoom))

        updateCanvasPosition()
    }


    document.getElementById("canvasSize_x").onchange = (event) => {resizeFromInput(event, 0)};
    document.getElementById("canvasSize_y").onchange = (event) => {resizeFromInput(event, 1)};

    document.body.onresize = () => {updateCanvasPosition()}
})