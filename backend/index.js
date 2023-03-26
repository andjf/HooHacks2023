const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

const state = require("./state/state.js");
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
app.use(cors());

state.createGlobalState(parseInt(process.env.BOARD_WIDTH), parseInt(process.env.BOARD_HEIGHT));

app.use("/ws", ws_routes);

const server = app.listen(process.env.PORT_NUMBER, "100.92.177.10", (error) => {
    if (error) return console.log("Error: ", error);
    console.log("Server listening on port", server.address().port);
});
