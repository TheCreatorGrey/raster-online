function putPixel(ctx, x, y, color, overwrite=false) {
    if (overwrite) {
        ctx.clearRect(x, y, 1, 1)
    }

    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    ctx.fillRect(x, y, 1, 1) 
}

function getPixel(ctx, x, y) {
    let color = ctx.getImageData(x, y, 1, 1).data;

    return [
        color[0],
        color[1],
        color[2],
        color[3]/255
    ]
}

function drawLine(ctx, x0, y0, x1, y1, rgba=[0, 0, 0, 1]) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = Math.sign(x1 - x0);
    const sy = Math.sign(y1 - y0);
    let err = dx - dy;
  
    while (true) {
        putPixel(
            ctx,
            x0, y0, 
            rgba
        )
    
        if (x0 === x1 && y0 === y1) break;
    
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }
}

function drawRect(context, topLeft, bottomRight, color) {
    let top = topLeft[1];
    let left = topLeft[0];
    let bottom = bottomRight[1];
    let right = bottomRight[0];

    drawLine(
        context,
        left, top,
        right, top,
        color
    );

    drawLine(
        context,
        right, top,
        right, bottom,
        color
    );

    drawLine(
        context,
        right, bottom,
        left, bottom,
        color
    );

    drawLine(
        context,
        left, top,
        left, bottom,
        color
    );
}


function mousePositionFromEvent(event, element, resolution) {
    let bounding = element.getBoundingClientRect();

    let posX = event.clientX;
    let posY = event.clientY;

    posX -= bounding.left;
    posY -= bounding.top;
    
    posX /= bounding.width;
    posY /= bounding.height;

    posX *= resolution[0];
    posY *= resolution[1];

    posX = Math.floor(posX);
    posY = Math.floor(posY);

    return [posX, posY]
}