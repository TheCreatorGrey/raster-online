var input = document.getElementById("imageInput");


input.onchange = async (e) => { 
    var file = e.target.files[0]; 

    var reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = readerEvent => {
        var content = readerEvent.target.result;

        var image = new Image();
        image.onload = () => {
            if (canvasResolution[0] < image.width) {
                canvasResolution[0] = image.width
            }

            if (canvasResolution[1] < image.height) {
                canvasResolution[1] = image.height
            }

            adjustCanvas()
            updateCanvasPosition()

            changeLog.push([8, [0, 0, 0], [0, 0], image])

            reRender()

            document.getElementById("canvasSize_x").innerText = canvasResolution[0]
            document.getElementById("canvasSize_y").innerText = canvasResolution[1]
            
        }
        image.src = content;
    }
}

input.onclick = function () {
    // Reset the file input so the same image can be re-imported
    this.value = null;
};

document.getElementById("importBtn").onclick = () => {
    input.click();
}