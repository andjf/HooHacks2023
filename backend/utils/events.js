var EventEmitter = require("events").EventEmitter;
var emitter = new EventEmitter();
const STATE_UPDATE_EVENT = "state_update";

module.exports = { emitter, STATE_UPDATE_EVENT };