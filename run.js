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
const maps = require('./utils/maps')
const gametypes = require('./utils/gametypes')
// TO-DO: CLI?

eventhandler.initEventHandler() // backbone
config.initConf()   // read all configurations
db.initMySQLdb()  // can take seconds depending upon database server ping and if it's initial setup

eventhandler.bot.once( 'database_ready', async ()=> 
    {
        await groups.init()   // register all user groups
        maps.init()
        gametypes.init()
    })

eventhandler.bot.once( 'groups_ready', async () =>
    {
        await rcon.initRcon()    // create UDP socket for rcon
        await msnger.init()   // chat rcon messenger
        await client.init()   // global client object        
        await plugins.init()    // plugin init
        await logread.initLogRead()  // begin reading logfile
        await cmdHandler.init()   // process all incoming commands
    })

eventhandler.bot.emit('ready')