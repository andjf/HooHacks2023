const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const state = require("./state/state.js");
const api_routes = require("./routes/api_routes.js");
const ws_routes = require("./routes/ws_routes.js");

dotenv.config()

// Load in environment variables
console.log(process.env)

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

state.createGlobalState(process.env.BOARD_WIDTH, process.env.BOARD_HEIGHT);
//state.addNewRevision([{ x: 0, y: 0, color: 0xFFBBCC }], null);
//state.addNewRevision([{ x: 1, y: 0, color: 0xDD0000 }, { x: 3, y: 2, color: 0x212343 }], null);
//state.rollbackToRevision(1);
//console.log(state.getCurrentRevision())

app.use("/api", api_routes);
app.use("/ws", ws_routes);

const server = app.listen(process.env.PORT_NUMBER, (error) => {
    if (error) return console.log("Error: ", error);
    console.log("Server listening on port", server.address().port);
});