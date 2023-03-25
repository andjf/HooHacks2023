const { json } = require('body-parser');
const fs = require('fs');
const glob = require('glob');

let global_state = { width: 0, height: 0, state: [] };
let state_revision = 0;

var Pixel = function (color) {
    return {
        "color": color,
    };
};

function removeOldBoardStateFiles() {
    let json_files = glob.globSync("./state/revisions/*.json");

    for (let file of json_files) {
        fs.unlinkSync(file);
        console.log(`${file} was deleted!`);
    };
}

function writeBoardStateToFile(state, revision) {
    fs.writeFile(`./state/revisions/${revision}.json`, JSON.stringify(state), (error) => {
        if (error) throw error;
    });
}

// Create the width x height matrix of white cells with revision 0 (genesis) as the history
function createGlobalState(width, height) {
    // Clear out board states from a previous run
    removeOldBoardStateFiles();

    global_state.height = height;
    global_state.width = width;

    for (let y = 0; y < height; y++) {
        global_state.state[y] = [];
        for (var x = 0; x < width; x++) {
            global_state.state[y][x] = Pixel("#000000");
        }
    }

    writeBoardStateToFile(global_state, 0);
}

function rollbackToRevision(prev_revision){
    if(prev_revision < 0 || prev_revision > state_revision){
        return;
    }


}

function addNewRevision(modified_state) {
    state_revision++;

    for (update of modified_state) {
        let x = update.x;
        let y = update.y;
        let color = update.color;

        console.log("Updating: ", { x: x, y: y, color: update.color });


        if (x < 0 || x > global_state.width) {
            continue;
        }
        if (y < 0 | y > global_state.height) {
            continue;
        }

        global_state.state[y][x].color = color;
    }

    writeBoardStateToFile(global_state, state_revision);
}

module.exports = { createGlobalState, addNewRevision };