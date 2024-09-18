const toolArea = document.getElementById("toolarea");

const tools = {
    "select":{
        id:6,
    },

    "draw":{
        id:0,
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



    "lighten":{
        id:3,
        filter_id:0
    },

    "darken":{
        id:3,
        filter_id:1
    },

    "stipple":{
        id:3,
        filter_id:2
    },

    "noise":{
        id:3,
        filter_id:3
    },

    "clear":{
        id:3,
        filter_id:4
    },
}


// Populates the sidebar with buttons for each tool
for (var t in tools) {
    let tool = tools[t];

    toolArea.insertAdjacentHTML(
        'beforeend',
        `
        <button class="toolButton" onclick="toolID = ${tool.id}; filterMode = ${tool.filter_id}">
            <img src="./assets/tools/${t}.png" title="${t}">
        </button>
        `
    )
}