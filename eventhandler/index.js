// this file manages all the events and provides accessibility to plugins
const events = require('events')

module.exports = 
{
    init
}

function init()
{
    console.log("Initializing Event Handler")
    var player = new events.EventEmitter()
    var server = new events.EventEmitter()
    var bot = new events.EventEmitter()
    
    this.player = player
    this.server = server
    this.bot = bot

    console.log("Initializing Event Handler Complete")
}