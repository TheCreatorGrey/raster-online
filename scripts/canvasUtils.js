// I would add more commenting here but it seems fairly obvious what these do...

async function putPixel(ctx, x, y, color, overwrite=false) {
    if (overwrite) {
        await ctx.clearRect(x, y, 1, 1)
    }

    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    await ctx.fillRect(x, y, 1, 1) 
}

function clearPixel(ctx, x, y) {
    ctx.clearRect(x, y, 1, 1)
}

async function getPixel(ctx, x, y) {
    let color = await ctx.getImageData(x, y, 1, 1).data;

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
    let normX = Math.sign(x1 - x0);
    let normY = Math.sign(y1 - y0);
    let err = dx - dy;
  
    while (true) {
        putPixel(
            ctx,
            x0, y0, 
            rgba
        )
    
        if ((x0 === x1) && (y0 === y1)) {
            break
        }
    
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy; 
            x0 += normX
        }
        if (e2 < dx) {
            err += dx; 
            y0 += normY
        }
    }
}

function drawRect(context, topLeft, bottomRight, color) {
    let top = topLeft[1];
    let left = topLeft[0];
    let bottom = bottomRight[1];
    let right = bottomRight[0];

    // If rect is inverted, correct coordinates
    if (top > bottom) {
        let t = top
        top = bottom
        bottom = t
    }

    if (right < left) {
        let r = right
        right = left
        left = r
    }

    let width = right-left
    let height = bottom-top

    context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;


    // If scale on either dimension is <2, just draw single rectangle
    if (
        (Math.abs(width) < 2) ||
        (Math.abs(height) < 2)
    ) {
        context.fillRect(left, top, width+1, height+1)
    } else { // Draw normally
        context.fillRect(left, top, width+1, 1) // Top
        context.fillRect(right, top+1, 1, height-1) // Right
        context.fillRect(left, bottom, width+1, 1) // Bottom
        context.fillRect(left, top+1, 1, height-1) // Left
    }
}

function intersectsRect(point, rect) {
    if (
        (rect[0] <= point[0]) && // is point past the left side of the rect
        (rect[1] <= point[1]) && // is point past the top side of the rect
        (point[0] <= (rect[0]+rect[2])) && // is point before the right side of the rect
        (point[1] <= (rect[1]+rect[3])) // is point before the bottom side of the rect
    ) {
        return true
    }
}