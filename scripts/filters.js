const filters = [
    // 0 (brighten)
    {
        "alias":"Brighten",

        "filter":(color, x, y, filterColor) => {
            return [color[0]+8, color[1]+8, color[2]+8, color[3]]
        },
    },


    // 1 (darken)
    {
        "alias":"Darken",

        "filter":(color, x, y, filterColor) => {
            return [color[0]-8, color[1]-8, color[2]-8, color[3]]
        },
    },


    // 2 (greyscale)
    {
        "alias":"Greyscale",

        "filter":(color, x, y, filterColor) => {
            let average = (color[0] + color[1] + color[2]) / 3;
            return [average, average, average, color[3]]
        },
    },


    // 2 (tint)
    {
        "alias":"Tint",

        "filter":(color, x, y, filterColor) => {
            let average = (color[0] + color[1] + color[2]) / 3;
            average /= 255;

            return [filterColor[0]*average, filterColor[1]*average, filterColor[2]*average, filterColor[3]]
        },
    },


    // 3 (dither)
    {
        "alias":"Dither",

        "filter":(color, x, y, filterColor) => {
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

        "filter":(color, x, y, filterColor) => {
            rdm = 5 * (Math.random()-.5)

            return [color[0]+rdm, color[1]+rdm, color[2]+rdm, color[3]];
        },
    },


    // 4 (extract)
    {
        "alias":"Lines",

        "filter":(color, x, y, filterColor) => {
            let average = (color[0] + color[1] + color[2]) / 3;
            let finalColor = [0, 0, 0, 0];

            if (average < 50) {
                finalColor = [0, 0, 0, 1]
            }

            return finalColor
        },
    },


    // 5 (clear)
    {
        "alias":"Clear",

        "filter":(color, x, y, filterColor) => {
            return [0, 0, 0, 0];
        },
    },
]

async function filterSelection(id) {
    await drawChange([8, cloneArray(strokeColor), selection, id, cloneArray(strokeColor)]);
    await applyChanges();
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