const toolArea = document.getElementById("toolarea");

const tools = {
    "Select":{
        id:6,
        icon:"select"
    },

    "Draw":{
        id:0,
        icon:"draw"
    },

    "Line":{
        id:1,
        icon:"line"
    },

    "Rectangle":{
        id:2,
        icon:"rect"
    },

    "Fill":{
        id:4,
        icon:"fill"
    },

    "Replace":{
        id:5,
        icon:"replace"
    },



    "Lighten":{
        id:3,
        icon:"filter",
        filter_id:0
    },

    "Darken":{
        id:3,
        icon:"filter",
        filter_id:1
    },

    "Stipple":{
        id:3,
        icon:"filter",
        filter_id:2
    },

    "Noise":{
        id:3,
        icon:"filter",
        filter_id:3
    },
}


for (var t in tools) {
    let tool = tools[t];

    console.log(t, tool)

    toolArea.insertAdjacentHTML(
        'beforeend',
        `
        <button class="toolButton" onclick="toolID = ${tool.id}; filterMode = ${tool.filter_id}">
            ${t}
        </button>
        `
    )
}