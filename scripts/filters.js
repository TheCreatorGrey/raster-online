const filters = [
    // 0 (brighten)
    {
        "alias":"Brighten",

        "filter":(color) => {
            return [color[0]+10, color[1]+10, color[2]+10, color[3]]
        },
    },


    // 1 (darken)
    {
        "alias":"Darken",

        "filter":(color) => {
            return [color[0]-10, color[1]-10, color[2]-10, color[3]]
        },
    },


    // 3 (dither)
    {
        "alias":"Dither",

        "filter":(color, x, y) => {
            let alpha = color[3];

            // you may want to improve this code later (it sucks)
            if (x % 2 && !(y % 2)) {
                alpha = 0
            }
            if ((x-1) % 2 && !((y-1) % 2)) {
                alpha = 0
            }

            return [color[0], color[1], color[2], alpha]
        },
    },


    // 4 (noise)
    {
        "alias":"Noise",

        "filter":(color) => {
            rdm = 5 * (Math.random()-.5)

            return [color[0]+rdm, color[1]+rdm, color[2]+rdm, color[3]];
        },
    },


    // 5 (clear)
    {
        "alias":"Clear",

        "filter":(color) => {
            return [0, 0, 0, 0];
        },
    },
]

function filterSelection(id) {
    drawChange(previewCtx, [8, strokeColor, selection, id]);
    applyChanges();
}

// Populates the selection context menu with buttons for each filter
for (var f in filters) {
    let filter = filters[f];

    selectionContext.insertAdjacentHTML(
        'beforeend',
        `
        <button onclick="filterSelection(${f})" title="${filter.alias}">
            ${filter.alias}
        </button>
        `
    )
}