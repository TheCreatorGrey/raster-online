function getDistance(p1, p2) {
    return Math.sqrt(
        ((p2[0] - p1[0])**2) + 
        ((p2[1] - p1[1])**2)
    )
}

// Corrects inverted rectangles
function correctRect(left, top, right, bottom) {
    let startX = left;
    let startY = top;

    let endX = right;
    let endY = bottom;

    // Correct coordinates
    if (endY < startY) {
        let s = startY
        startY = endY
        endY = s
    }
    if (endX < startX) {
        let s = startX
        startX = endX
        endX = s
    }

    return [startX, startY, endX, endY]
}