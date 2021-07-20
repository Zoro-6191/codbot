// this file initiates our bot
const logread = require("./logread.js")
const db = require('./db.js')
const config = require('./conf')
const rcon = require('./rcon.js')
const eventhandler = require('./eventhandler')
const cmdHandler = require('./commandhandler')
const client = require('./client.js')
const groups = require("./groups.js")
const msnger = require('./msnger')
const plugins = require('./plugins')
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

// console.log( eventhandler )

var uptime = 1000000

var seconds = Math.floor(uptime/1000)
var minutes = Math.floor(seconds/60)
var hours = Math.floor(minutes/60)
var days = Math.floor(hours/24)

hours = days?hours%24:hours
minutes = days?0:(hours?minutes%60:minutes)
seconds = days?0:(hours?0:(minutes?seconds%60:seconds))

uptime = `${days?(days==1?days+' Day ':days+' Days '):''}${hours?(hours==1?hours+' Hour ':hours+' Hours '):''}${minutes?(minutes==1?minutes+' min ':minutes+' mins '):''}${seconds?(seconds==1?seconds+' sec ':seconds+' secs '):''}`

console.log(uptime)

eventhandler.bot.emit('ready')