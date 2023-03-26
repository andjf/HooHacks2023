const express = require("express");
const utils = require("../utils/utils.js");
const state = require("../state/state.js");
const events = require("../utils/events.js");
let router = express.Router();

router.use((req, res, next) => {
    console.log("Time: ", utils.getCurrentTime());
    console.log("New WS Connection: ", req.hostname);
    console.log({ "url": req.url, "headers": req.headers });
    next()
});

function formatAndSend(ws, message, data) {
    ws.send(JSON.stringify({ message: message, data: data }));
}

router.ws("/", (ws, req) => {

    events.emitter.on(events.STATE_UPDATE_EVENT, () => {
        formatAndSend(ws, "success", state.getCurrentState());
    });

    ws.on("message", (msg) => {
        let json;
        try {
            json = JSON.parse(msg);
        }
        catch (error) {
            console.warn("Received text is missing a message field. Not processing.");
            formatAndSend(ws, "failure", "parsing failure");
            return;
        }

        let message = json.message;
        let data = json.data;
        console.log(message, data)

        if (message === undefined) {
            console.warn("Received text is missing a message field. Not processing.");
            formatAndSend(ws, "failure", "missing message field");
            return;
        }

        switch (message) {
            case ("get_revision"):
                formatAndSend(ws, "success", state.getCurrentRevision());
                break;
            case ("get_update"):
                formatAndSend(ws, "success", state.getCurrentState());
                break;
            case ("get_dimensions"):
                formatAndSend(ws, "success", state.getDimensions());
                break;
            case ("post_rollback"):
                state.rollbackToRevision(data);
                formatAndSend(ws, "success", "");
                break;
            case ("post_update"):
                state.addNewRevision(data, null);
                formatAndSend(ws, "success", "");
                state
                break;
            default:
                formatAndSend(ws, "failure", "unrecognized action");
                console.warn("Unsupported ws action: ", message);
                break;
        }
    });

    ws.on("close", () => {
        console.log("WebSocket was closed");
    });
})

module.exports = router;