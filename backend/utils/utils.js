
function getCurrentTime(){
    return new Date(Date.now()).toTimeString()
}

module.exports = {getCurrentTime};