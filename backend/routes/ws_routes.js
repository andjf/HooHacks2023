const express = require("express");
const utils = require("../utils/utils.js");
let router = express.Router();

router.use((req, res, next) => {
    console.log("Time: ", utils.getCurrentTime());
    console.log("New WS Connection: ", req.hostname);
    console.log({ "url": req.url, "headers": req.headers, "body": req.body });
    next()
});

// Print time of each request
router.ws('/test', (ws, req) => {
    ws.on('message', msg => {
        ws.send(msg)
    })

    ws.on('close', () => {
        console.log('WebSocket was closed')
    })
})

module.exports = router;