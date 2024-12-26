const toolArea = document.getElementById("toolarea");

const tools = [

    // The following is a list of tools in code form.


    // 0 (draw / multi-point line)
    {
        alias:"draw", // The name to which the tool is referred

        // Whether the change is induced by the user or not.
        // If false, the change is induced internally, by the program.
        // Ultimately, this decides whether the tool shows up on
        // the toolbar or not.
        user_selected:true,

        // "to be changed" means the value will be modified when the user drags the mouse
        getStructure:(mouseX, mouseY) => {
            //      \/ array of points (to be changed)
            return [[]]
        },

        // Called when the user drags the mouse.
        // The values marked as "to be changed" above will be updated here.
        update:(change, mouseX, mouseY) => {
            change[2].push([mouseX, mouseY])
        },
        
        // Called when the change is to be drawn to the canvas
        draw: async (context, args) => {

            let color = args[1];

            let lines = args[2];
            let lastPos;

            // Put first pixel since this is ignored below
            if (lines.length > 0) {
                putPixel(
                    context,
                    lines[0][0], lines[0][1], 
                    color
                )
            }

            for (var l of lines) {
                if (lastPos) {
                    if (getDistance(lastPos, l) >= 1) {

                        // This is the same calculation that is used in
                        // the line algorithm which decides where the next
                        // pixel should be. By offsetting the first position
                        // by the result of this equation, the first pixel of
                        // the line will be removed, avoiding overlap
                        offsetx = Math.sign(l[0] - lastPos[0]);
                        offsety = Math.sign(l[1] - lastPos[1]);

                        drawLine(
                            context,
                            lastPos[0] + offsetx, 
                            lastPos[1] + offsety,
                            l[0], l[1],
                            color
                        )
                    }
                }

                lastPos = l
            }

        }
    },















    // 1 (erase)
    {
        alias:"erase",

        user_selected:true,
        
        getStructure:(mouseX, mouseY) => {
            //      \/ array of points (to be changed)
            return [[]]
        },

        update:(change, mouseX, mouseY) => {
            change[2].push([mouseX, mouseY])
        },

        draw: async (context, args) => {

            let points = args[2];

            for (var p of points) {
                clearPixel(mainCtx, p[0], p[1])
            }

        }
    },















    // 2 (straight line / 2-point line)
    {
        alias:"line",

        user_selected:true,
        
        getStructure:(mouseX, mouseY) => {
            //      \/ start           \/ end (to be changed)
            return [[mouseX, mouseY], [mouseX, mouseY]]
        },

        update:(change, mouseX, mouseY) => {
            change[3][0] = mouseX;
            change[3][1] = mouseY
        },

        draw: async (context, args) => {

            let color = args[1];

            let p1 = args[2];
            let p2 = args[3];

            drawLine(
                context,
                p1[0], p1[1],
                p2[0], p2[1],
                color
            )

        }
    },















    // 3 (rectangle)
    {
        alias:"rect",

        user_selected:true,

        getStructure:(mouseX, mouseY) => {
            //       \/ top left       \/ bottom right (to be changed)
            return [[mouseX, mouseY], [mouseX, mouseY]]
        },

        update:(change, mouseX, mouseY) => {
            change[3][0] = mouseX;
            change[3][1] = mouseY
        },

        draw: async (context, args) => {

            let color = args[1];

            let top = args[2][1];
            let bottom = args[3][1];
            let left = args[2][0];
            let right = args[3][0];

            drawRect(
                context, 
                [left, top], 
                [right, bottom],
                color
            )

        }
    },















    // 4 (circle)
    {
        alias:"circle",

        user_selected:true,

        getStructure:(mouseX, mouseY) => {
            //     \/ top left        \/ bottom right (to be changed)
            return [[mouseX, mouseY], [mouseX, mouseY]]
        },

        update:(change, mouseX, mouseY) => {
            change[3][0] = mouseX;
            change[3][1] = mouseY;
        },

        draw: async (context, args) => {

            let color = args[1];

            let center = args[2];
            let edge = args[3];
            let radius = Math.ceil(getDistance(center, edge));

            for (let x=center[0]-radius; x < center[0]+radius; x++) {
                for (let y=center[1]-radius; y < center[1]+radius; y++) {
                    let distanceFromCenter = Math.round(getDistance(center, [x, y]))

                    if (distanceFromCenter < radius) {
                        await putPixel(context, x, y, color)
                    }
                }
            }

        }
    },















    // 5 (fill)
    {
        alias:"fill",

        user_selected:true,

        getStructure:(mouseX, mouseY) => {
            //      \/ point in area to fill
            return [[mouseX, mouseY]]
        },

        update:null,

        draw: async (context, args) => {

            let color = args[1];

            let fillQueue = [];
            let filled = [];

            let start = args[2];
            let targetColor = await getPixel(mainCtx, start[0], start[1]);

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
                
                let pointColor = await getPixel(mainCtx, x, y);

                // If color is an exact match, change pixel and continue
                if (
                    (pointColor[0] === targetColor[0]) && 
                    (pointColor[1] === targetColor[1]) && 
                    (pointColor[2] === targetColor[2]) && 
                    (pointColor[3] === targetColor[3])
                ) {
                    await putPixel(context, x, y, color);
                    filled.push(`${x}/${y}`)

                    fillQueue.push([x+1, y]) // Add surrounding points to be checked
                    fillQueue.push([x-1, y])
                    fillQueue.push([x, y+1])
                    fillQueue.push([x, y-1])
                }

                await delay(.01);
            }

        }
    },















    // 6 (replace color)
    {
        alias:"replace",

        user_selected:true,

        getStructure:(mouseX, mouseY) => {
            //      \/ Point of color to replace
            return [mouseX, mouseY]
        },

        update:null,

        draw: async (context, args) => {

            let color = args[1];
            let toReplace = await getPixel(mainCtx, args[2], args[3]);

            for (let x=0; x < canvasResolution[0]; x++) {
                for (let y=0; y < canvasResolution[1]; y++) {
                    let originalColor = await getPixel(mainCtx, x, y);
    
                    if (
                        (originalColor[0] === toReplace[0]) && 
                        (originalColor[1] === toReplace[1]) && 
                        (originalColor[2] === toReplace[2]) && 
                        (originalColor[3] === toReplace[3])
                    ) {
                        await putPixel(context, x, y, color);
                    }
                }

                await delay(1);
            }

        }
    },
















    // 7 (clone selection)
    {
        alias:"clone selection",

        user_selected:false,

        getStructure:(mouseX, mouseY) => {
            //     \/ selection            \/ initial        \/ offset (to be changed)
            return [cloneArray(selection), [mouseX, mouseY], [mouseX, mouseY]]
        },

        update:(change, mouseX, mouseY) => {
            change[4][0] = mouseX-change[3][0];
            change[4][1] = mouseY-change[3][1];

            // Update visualisation to match actual selection
            selection[4] = change[4][0];
            selection[5] = change[4][1];
        },

        draw: async (context, args) => {
            let offset = args[4];
            let [startX, startY, endX, endY] = correctRect(...args[2]);

            let size = [
                endX - startX,
                endY - startY
            ]

            let region = mainCtx.getImageData(startX, startY, size[0], size[1]);
            //context.clearRect(startX, startY, size[0], size[1]);
            context.putImageData(region, startX+offset[0], startY+offset[1]);

        }
    },















    // 8 (filter)
    {
        alias:"filter",

        user_selected:false,

        // Since this is applied through the context menu, the
        // "getStructure" function isn't necessary. But for
        // readability purposes, here's what it looks like:
        // [selection, filter ID, filter color (only used with some filters)]
        getStructure:null,

        update:null,

        draw: async (context, args) => {
            let [startX, startY, endX, endY] = correctRect(...args[2]);

            let pixelCt = 0;
            let delayInterval = 2000; // There will be a 1ms delay every 2000 pixels to prevent crashing

            for (let x=startX; x < endX; x++) {
                for (let y=startY; y < endY; y++) {
                    let currentColor = await getPixel(mainCtx, x, y);
                    let newColor = filters[args[3]].filter(currentColor, x, y, args[4])
    
                    await putPixel(
                        mainCtx,
                        x, y, 
                        newColor,
                        true
                    )

                    pixelCt += 1;

                    if (pixelCt === delayInterval) {
                        pixelCt = 0;
                        await delay(1);
                    }
                }
            }

        }
    },















    // 9 (image)
    {
        alias:"image",

        user_selected:false,

        // [[x, y], image data]
        getStructure:null,

        update:null,

        draw: async (context, args) => {
            let position = args[2];
            let image = args[3];

            context.drawImage(image, position[0], position[1])
        }
    },















    // 10 (clear)
    {
        alias:"clear",

        user_selected:true,

        getStructure:(mouseX, mouseY) => {
            // No arguments
            return []
        },

        update:null,

        draw: async (context, args) => {
            mainCtx.clearRect(0, 0, canvasResolution[0], canvasResolution[1])
        }
    },
]



// Populates the sidebar with buttons for each tool
for (var t in tools) {
    let tool = tools[t];

    if (tool.user_selected) {
        toolArea.insertAdjacentHTML(
            'beforeend',
            `<button class="toolButton" onclick="toolID = ${t}; filterMode = ${tool.filter_id}" title="${tool.alias}">
                <img src="./assets/tools/${tool.alias}.png">
            </button>`
        )
    }
}