// this file initiates our bot
const logread = require("./logread.js")
const db = require('./db.js')
const config = require('./conf')
const rcon = require('./rcon.js')
const eventhandler = require('./eventhandler')
const cmdHandler = require('./commandhandler')
const client = require('./client.js')
const groups = require("./groups.js")
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

eventhandler.initEventHandler() // juice
config.initConf()   // read all configurations
db.initMySQLdb()  // can take seconds depending upon database server ping and if it's initial setup

eventhandler.bot.once( 'database_ready', ()=> {
    groups.init()   // register all admin groups
    rcon.initRcon()    // create UDP socket for rcon
    client.init()   // global client object
    logread.initLogRead()  // begin reading logfile
    cmdHandler.init()   // process all incoming commands
})

// console.log( eventhandler )

eventhandler.bot.emit('ready')