const colorCanvas = document.getElementById('picker');
const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

const subdivisions = 16;

colorCanvas.width=subdivisions;
colorCanvas.height=5;
colorCanvas.style.width=200;
colorCanvas.style.height=200;

let strokeColor = [0, 0, 0, 1];

function redrawPicker() {
    colorCtx.clearRect(0, 0, 200, 250);

    let factor = (256/subdivisions);

    for (let x=0; x < 255; x++) {
        for (let y=0; y < 200; y++) {
            if (y === 0) {
                if (x <= ((subdivisions/2)-1)) {
                    putPixel(
                        colorCtx, 
                        x, y,
                        strokeColor
                    )
                }
            }
            
            if (y === 1) {
                putPixel(colorCtx, x, y, [x*factor, 0, 0, 1])
            }
    
            if (y === 2) {
                putPixel(colorCtx, x, y, [0, x*factor, 0, 1])
            }
    
            if (y === 3) {
                putPixel(colorCtx, x, y, [0, 0, x*factor, 1])
            }
    
            if (y === 4) {
                putPixel(colorCtx, x, y, [0, 0, 0, x/subdivisions])
            }
        }
    
        putPixel(colorCtx, strokeColor[0]/factor, 1, [255, 255, 255, 1])
        putPixel(colorCtx, (strokeColor[0]/factor)-1, 1, [220, 220, 220, 1])

        putPixel(colorCtx, strokeColor[1]/factor, 2, [255, 255, 255, 1])
        putPixel(colorCtx, (strokeColor[1]/factor)-1, 2, [220, 220, 220, 1])

        putPixel(colorCtx, strokeColor[2]/factor, 3, [255, 255, 255, 1])
        putPixel(colorCtx, (strokeColor[2]/factor)-1, 3, [220, 220, 220, 1])

        putPixel(colorCtx, strokeColor[3]*subdivisions, 4, [255, 255, 255, 1])
        putPixel(colorCtx, (strokeColor[3]*subdivisions)-1, 4, [220, 220, 220, 1])
    }
}

redrawPicker()

var dragging = false;

colorCanvas.onmousemove = (event) => {
    if (dragging) {
        let mp = mousePositionFromEvent(event, colorCanvas, [subdivisions, 5], false);
        let posX = mp[0];
        let posY = mp[1];

        posX = Math.round(posX);
        posY = Math.floor(posY)

        console.log(posX, posY)

        strokeColor[posY-1] = posX*(256/subdivisions);

        if (posY === 4) {
            strokeColor[3] = posX/subdivisions;
        }

        redrawPicker()
    }
};

colorCanvas.onmousedown = () => {
    dragging = true
}

colorCanvas.onmouseup = () => {
    dragging = false

    console.log(strokeColor)
}

colorCanvas.onmouseout = () => {
    dragging = false
    console.log(strokeColor)
}