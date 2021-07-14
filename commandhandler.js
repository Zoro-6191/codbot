const ErrorHandler = require('./eventhandler')

module.exports = 
{
    init
}

async function init()
{
    // firstly we map commands to plugins, done through conf module
    // then parse actual commands outta say/sayteam event
    // maybe then even emit a separate event for it like emit('command',slot,cmd,args)
    // also need to do search slot from player from playername as user types it
}