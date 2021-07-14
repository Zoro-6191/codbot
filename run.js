// this file initiates our bot
const logread = require("./logread.js")
const db = require('./db.js')
const config = require('./conf')
const rcon = require('./rcon.js')
const eventhandler = require('./eventhandler')
const client = require('./client.js')
// TO-DO: CLI args?

// =================================================
// create read stream - done
// setup general rcon use - done
// connect to mysql db and keep it alive - done
// analyze each line and emit events for it - done
// create a standard for the plugins
// create a standard for commands
// proper error and exception handling
// =================================================
// console.log( Math.floor(Date.now()/1000) )

eventhandler.initEventHandler()
config.initConf()   // read all configurations
rcon.initRcon()    // create UDP socket for rcon
db.initMySQLdb()   // connect to mysql database
client.init()
logread.initLogRead()  // begin reading logfile

// console.log( eventhandler )

eventhandler.bot.emit('ready')