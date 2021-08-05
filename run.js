// this module initiates our bot
const eventhandler = require('./src/eventhandler')
const logread = require("./src/logread.js")
const cmdHandler = require('./src/commandhandler')
const db = require('./utils/db.js')
const rcon = require('./utils/rcon.js')
const client = require('./utils/client.js')
const groups = require("./utils/groups.js")
const msnger = require('./utils/msnger')
const config = require('./conf')
const plugins = require('./plugins')
// TO-DO: CLI?

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

eventhandler.bot.once( 'database_ready', ()=> 
    {
        groups.init()   // register all admin groups
        rcon.initRcon()    // create UDP socket for rcon
        client.init()   // global client object
        msnger.init()   // chat rcon messenger
        logread.initLogRead()  // begin reading logfile
        cmdHandler.init()   // process all incoming commands
        plugins.init()
    })

eventhandler.bot.emit('ready')