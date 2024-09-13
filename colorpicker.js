const colorCanvas = document.getElementById('picker');
const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

colorCanvas.width=16;
colorCanvas.height=5;
colorCanvas.style.width=200;
colorCanvas.style.height=200;

let strokeColor = [0, 0, 0, 1];


function redrawPicker() {
    colorCtx.clearRect(0, 0, 200, 250);

    for (let x=0; x < 255; x++) {
        for (let y=0; y < 200; y++) {
            if (y === 0) {
                putPixel(
                    colorCtx, 
                    x, y,
                    strokeColor
                )
            }
            
            if (y === 1) {
                putPixel(colorCtx, x, y, [x*16, 0, 0, 1])
            }
    
            if (y === 2) {
                putPixel(colorCtx, x, y, [0, x*16, 0, 1])
            }
    
            if (y === 3) {
                putPixel(colorCtx, x, y, [0, 0, x*16, 1])
            }
    
            if (y === 4) {
                putPixel(colorCtx, x, y, [0, 0, 0, x/16])
            }
        }
    
        colorCtx.fillStyle = `white`;
        colorCtx.fillRect(strokeColor[0]/16, 1, 1, 1) 
        colorCtx.fillRect(strokeColor[1]/16, 2, 1, 1) 
        colorCtx.fillRect(strokeColor[2]/16, 3, 1, 1) 
        colorCtx.fillRect(strokeColor[3]*16, 4, 1, 1) 
    }
}

redrawPicker()

var dragging = false;

colorCanvas.onmousemove = (event) => {
    if (dragging) {
        let mp = mousePositionFromEvent(event, colorCanvas, [255, 5]);
        let posX = mp[0];
        let posY = mp[1];

        console.log(posX, posY)

        strokeColor[posY-1] = posX;

        if (posY === 4) {
            strokeColor[3] = posX/255;
        }

        redrawPicker()
    }
};

colorCanvas.onmousedown = () => {
    dragging = true
}

colorCanvas.onmouseup = () => {
    dragging = false
}