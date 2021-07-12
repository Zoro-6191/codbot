// this file initiates our bot
const logread = require("./logread.js")
const db = require('./db.js')
const config = require('./conf')
const rcon = require('./rcon.js')
const eventhandler = require('./eventhandler')
// TO-DO: CLI args?

// =================================================
// create read stream - done
// setup general rcon use - done
// connect to mysql db and keep it alive - done
// analyze each line and emit events for it - done
// create a standard for the plugins
// create a standard for commands
// =================================================

eventhandler.init()
config.init()   // read all configurations

rcon.init()    // create UDP socket for rcon
db.init()   // connect to mysql database
logread.init()  // begin reading logfile