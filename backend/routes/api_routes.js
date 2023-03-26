const express = require("express");
const utils = require("../utils/utils.js");
const state = require("../state/state.js");
let router = express.Router();

router.use((req, res, next) => {
    console.log("Time: ", utils.getCurrentTime());
    console.log("New HTTP Request: ", req.hostname);
    console.log({
        "url": req.url, "method": req.method, "headers": req.headers, "body": req.body
    });
    next();
});

//Accept changed user pixels (POST)
//

router.post("/state", (req, res, next) => {
    let updated_pixels = req.body;
    state.addNewRevision([], null);
    res.send({ "message": "success" });
});

router.get("/state", (req, res, next) => {
    res.send({
        message: "success",
        state: state.getCurrentState()
    });
});

router.get("/dimensions", (req, res, next) => {
    res.send(state.getDimensions())
});

router.get("/revision", (req, res, next) => {
    res.send({
        message: "success",
        revision: state.getCurrentRevision()
    });
})

module.exports = router;