const colorCanvas = document.getElementById('picker');
const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

const colorIndicator = document.getElementById("rgba-indicator");
const CI_red = document.getElementById("indicator-red");
const CI_green = document.getElementById("indicator-green");
const CI_blue = document.getElementById("indicator-blue");
const CI_alpha = document.getElementById("indicator-alpha");

// How many pixels wide the color picker display is.
// this affects both the color depth and the speed
// at which the color picker is redrawn.
const subdivisions = 32;

colorCanvas.width=subdivisions;
colorCanvas.height=5;
colorCanvas.style.width=200;
colorCanvas.style.height=200;

let strokeColor = [0, 0, 0, 1];

function redrawPicker() {
    colorCtx.clearRect(0, 0, subdivisions, 5);

    let factor = (256/subdivisions);

    for (let x=0; x < 255; x++) {
        for (let y=0; y < 5; y++) {
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
    }

    // Draw the little knobs
    putPixel(colorCtx, strokeColor[0]/factor, 1, [255, 255, 255, 1])
    putPixel(colorCtx, (strokeColor[0]/factor)-1, 1, [220, 220, 220, 1])

    putPixel(colorCtx, strokeColor[1]/factor, 2, [255, 255, 255, 1])
    putPixel(colorCtx, (strokeColor[1]/factor)-1, 2, [220, 220, 220, 1])

    putPixel(colorCtx, strokeColor[2]/factor, 3, [255, 255, 255, 1])
    putPixel(colorCtx, (strokeColor[2]/factor)-1, 3, [220, 220, 220, 1])

    putPixel(colorCtx, strokeColor[3]*subdivisions, 4, [255, 255, 255, 1])
    putPixel(colorCtx, (strokeColor[3]*subdivisions)-1, 4, [220, 220, 220, 1])


    // Update RGBA color indicators
    CI_red.innerText = strokeColor[0];
    CI_green.innerText = strokeColor[1];
    CI_blue.innerText = strokeColor[2];
    CI_alpha.innerText = strokeColor[3].toFixed(2);
}

redrawPicker()

var dragging = false;

addEventListener("mousemove", (event) => {
    if (dragging) {
        let mp = mousePositionFromEvent(event, colorCanvas, [subdivisions, 5], false);
        let posX = mp[0];
        let posY = mp[1];

        posX = Math.round(posX);
        posY = Math.floor(posY)

        strokeColor[posY-1] = posX*(256/subdivisions);
        
        // Limits
        if (strokeColor[posY-1] < 0) {
            strokeColor[posY-1] = 0
        } else if (strokeColor[posY-1] > 255) {
            strokeColor[posY-1] = 255
        }


        // Alpha has a different range than the other channels
        // so it must be handled separately
        if (posY === 4) {
            strokeColor[3] = posX/subdivisions;

            if (strokeColor[3] < 0) {
                strokeColor[3] = 0
            } else if (strokeColor[3] > 1) {
                strokeColor[3] = 1
            }
        }

        redrawPicker()
    }
})

colorCanvas.onmousedown = () => {
    dragging = true
}

addEventListener("mouseup", () => {
    dragging = false
})