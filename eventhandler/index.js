// this file manages all the events and provides accessibility to plugins
const events = require('events')
var player = new events.EventEmitter()
var server = new events.EventEmitter()

module.exports = 
{
    player,
    server
}