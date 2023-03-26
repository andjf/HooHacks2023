const express = require("express");
const utils = require("../utils/utils.js");
const events = require("../utils/events.js");
let router = express.Router();

router.use((req, res, next) => {
    console.log("Time: ", utils.getCurrentTime());
    console.log("New WS Connection: ", req.hostname);
    console.log({ "url": req.url, "headers": req.headers });
    next()
});

router.ws("/notification", (ws, req) => {
    events.emitter.on(events.STATE_UPDATE_EVENT, () => {
        ws.send(JSON.stringify({ message: "State has been updated" }));
    });

    ws.on("message", () => {
        ws.send(JSON.stringify({ message: "No CRUD services are provided at this endpoint." }));
    })

    ws.on("close", () => {
        console.log("WebSocket was closed");
    })
})

module.exports = router;