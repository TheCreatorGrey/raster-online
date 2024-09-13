var input = document.createElement('input');
input.type = 'file';


input.onchange = async (e) => { 
    var file = e.target.files[0]; 

    var reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = readerEvent => {
        var content = readerEvent.target.result; // this is the content!
        console.log( content );

        var image = new Image();
        image.onload = () => {
            if (canvasResolution[0] < image.width) {
                canvasResolution[0] = image.width
            }

            if (canvasResolution[1] < image.height) {
                canvasResolution[1] = image.height
            }

            adjustCanvas()

            changeLog.push([8, [0, 0, 0], [0, 0], image])

            reRender()
            
        }
        image.src = content;
    }
}

document.getElementById("importBtn").onclick = () => {
    input.click();
}