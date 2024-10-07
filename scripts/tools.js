const toolArea = document.getElementById("toolarea");

const tools = {
    "draw":{
        id:0,
    },

    "erase":{
        id:9,
    },

    "line":{
        id:1,
    },

    "rect":{
        id:2,
    },
    
    "circle":{
        id:7,
    },

    "fill":{
        id:4,
    },

    "replace":{
        id:5,
    },

    "clone selection":{
        id:6,
    },

    "lighten":{
        id:3,
        filter_id:0
    },

    "darken":{
        id:3,
        filter_id:1
    },

    "dither":{
        id:3,
        filter_id:2
    },

    "noise":{
        id:3,
        filter_id:3
    },

    "clear selection":{
        id:3,
        filter_id:4
    },

    "empty-1":{
        placeholder:true
    },

    "empty-2":{
        placeholder:true
    },

    "empty-3":{
        placeholder:true
    }
}


// Populates the sidebar with buttons for each tool
for (var t in tools) {
    let tool = tools[t];

    if (tool.placeholder) {
        toolArea.insertAdjacentHTML(
            'beforeend',
            `
            <button class="toolButton"></button>
            `
        )
    } else {
        toolArea.insertAdjacentHTML(
            'beforeend',
            `
            <button class="toolButton" onclick="toolID = ${tool.id}; filterMode = ${tool.filter_id}" title="${t}">
                <img src="./assets/tools/${t}.png">
            </button>
            `
        )
    }
}