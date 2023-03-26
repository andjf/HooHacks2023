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

router.post("/state", (req, res, next) => {
    let changed_pixels = req.body.state;

    if (changed_pixels === undefined) {
        res.status(400).send({
            message: "failure",
            reason: "The message body is missing a state field"
        });
        return;
    }

    state.addNewRevision(changed_pixels, null);
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
});

router.post("/rollback", (req, res, next) => {
    let revision = req.body.revision;
    if (revision === undefined) {
        res.status(400).send({
            message: "failure",
            reason: "The message body is missing a revision field"
        });
        return;
    }
    state.rollbackToRevision(revision)
    res.send({
        message: "success"
    });
});

module.exports = router;