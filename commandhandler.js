const ErrorHandler = require('./eventhandler')

module.exports = 
{
    init
}

async function init()
{
    // firstly we map commands to plugins, done through conf module
    // then parse actual commands outta say/sayteam event in this module
    // maybe then even emit a separate event for it like emit('command',slot,cmd,args)
    // or just point it directly to plugins
    // also need to do search slot from player from playername as user types it
    // could point it to individual plugins too
}