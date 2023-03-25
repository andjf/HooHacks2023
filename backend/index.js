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
const PORT_NUMBER = process.env.PORT_NUMBER;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

state.createGlobalState(10, 10);
state.addNewRevision([{ x: 0, y: 0, color: "#FF0000" }], null);
state.addNewRevision([{ x: 1, y: 0, color: "#DD0000" }, { x: 3, y: 2, color: "#212343" }], null);
state.rollbackToRevision(1);

app.use('/api', api_routes);
app.use('/ws', ws_routes);


const server = app.listen(PORT_NUMBER, (error) => {
    if (error) return console.log(`Error: ${error}`);
    console.log(`Server listening on port ${server.address().port}`);
});
