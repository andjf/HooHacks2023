const fs = require("fs");
const glob = require("glob");
const events = require("../utils/events.js");

let global_state = { width: 0, height: 0, state: [] };
let state_revision = 0;


function removeOldBoardStateFiles() {
    let json_files = glob.globSync("./state/revisions/*.json");

    for (let file of json_files) {
        fs.unlinkSync(file), (error) => {
            if (error) throw error;
        };
        console.log(`${file} was deleted!`);
    };
}

function fetchBoardStateFromFile(revision) {
    console.log(`Fetching state ${revision} from a file.`)
    let data = fs.readFileSync(`./state/revisions/${revision}.json`);
    return JSON.parse(data);
}

function writeBoardStateToFile(state, revision) {
    console.log(`Writing state ${revision} to a file.`)
    fs.writeFileSync(`./state/revisions/${revision}.json`, JSON.stringify(state), (error) => {
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
            // Initialize each pixel to black (#000000)
            global_state.state[y][x] = 0x000000;
        }
    }

    writeBoardStateToFile(global_state, 0);
}

function getDimensions() {
    return {
        width: global_state.width,
        height: global_state.height
    };
}

function rollbackToRevision(prev_revision) {
    if (prev_revision < 0 || prev_revision > state_revision) {
        return;
    }

    console.log("Rolling back to revision", prev_revision)

    let modified_pixels = [];
    let safe_state = fetchBoardStateFromFile(prev_revision);
    let problem_state = fetchBoardStateFromFile(prev_revision + 1);

    // If rolling back to 0, do not fetch -1
    // Every pixel will be white, so just blank it out
    if (prev_revision === 0) {
        addNewRevision([], safe_state);
        return;
    }

    for (let y = 0; y < global_state.height; y++) {
        for (let x = 0; x < global_state.width; x++) {
            // Fetch both pixels
            let problem_pixel = problem_state.state[y][x];
            let safe_pixel = safe_state.state[y][x];
            // Compare colors
            if (safe_pixel !== problem_pixel) {
                // If they differ, push the safe color to the modified_pixels array
                console.log(`Diff at x = ${x} and y = ${y}`)
                modified_pixels.push({ x: x, y: y, color: safe_state.state[y][x] })
            }
        }
    }

    // Take each changed pixel and modify from the current state
    addNewRevision(modified_pixels, null);

    console.log("Rollback complete.")
}

function addNewRevision(changed_pixels, baseline_state) {
    // If no baseline state is provided, assume the global state
    if (baseline_state === null) {
        baseline_state = global_state;
    }

    // Increment the revision number
    state_revision++;

    console.log("Computing state", state_revision)

    for (update of changed_pixels) {
        let x = update.x;
        let y = update.y;
        let color = update.color;

        if (x < 0 || x >= baseline_state.width) {
            continue;
        }
        if (y < 0 || y >= baseline_state.height) {
            continue;
        }

        console.log("Updating: ", { x: x, y: y, color: color });

        // Change each necessary pixel in the baseline state
        baseline_state.state[y][x] = color;
    }

    // Commit this new state to a file
    writeBoardStateToFile(baseline_state, state_revision);

    //Update the global state to match
    global_state = baseline_state;

    events.emitter.emit(events.STATE_UPDATE_EVENT);
}

function getCurrentState() {
    return global_state;
}

function getCurrentRevision() {
    return state_revision;
}

module.exports = { createGlobalState, addNewRevision, rollbackToRevision, getCurrentRevision, getCurrentState, getDimensions };