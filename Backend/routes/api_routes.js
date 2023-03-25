const express = require("express");
const utils = require("../utils/utils.js");
let router = express.Router();

// Print time of each request
router.use((req, res, next) => {
    console.log("Time: ", utils.getCurrentTime());
    console.log("New HTTP Request: ", req.hostname);
    console.log({ "url": req.url, "headers": req.headers, "body": req.body });
    next();
});

//Accept changed user pixels (POST)
//

router.post("/new_state", (req, res, next) => {
    res.send({ "message": "hi" });
})

module.exports = router;