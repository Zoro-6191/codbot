const ErrorHandler = require('./errorhandler')

var prefix, prefix_loud

module.exports = 
{
    init
}

async function init()
{
    const { player } = require('./eventhandler')

    // firstly we map commands to plugins, done through conf module - done
    // then parse actual commands outta say/sayteam event in this module
    // maybe then even emit a separate event for it like emit('command',slot,cmd,args), maybe not good idea
    // or just point it directly to plugins, better
    // also need to do search slot from player from playername as user types it
    // could point it to individual plugins too, maybe bad idea

    const conf = require('./conf').mainconfig
    prefix = conf.cmd.prefix
    prefix_loud = conf.cmd.prefix_loud

    player.on('say/sayteam', ( guid, slot, ign, content ) => processChatforCMD( guid, slot, ign, content ) )
}

async function processChatforCMD( guid, slot, ign, content )
{
    const { command } = require('./conf')

    // remove extra white spaces from front and back
    content = content.trim()    

    // get out if prefix not there
    if( content[0] != prefix && content[0] != prefix_loud )
        return

    // now maybe separate command and args
    
    content = content.split(' ')

    // removal of prefix, for l8r use
    var cmd = [...content[0]]  // make array 
    cmd.shift() // remove prefix
    cmd = cmd.join('')  // make string

    var cmdargs = content
    cmdargs.shift()    // arguments will be an array so any number of args are possible

    // now to find if that command is in any of the plugins' config, even as alias
    // if alias, point to correct command
    
    var checkname = command.find( zz => zz.name == cmd )
    var checkalias = command.find( zz => zz.alias == cmd )

    if( checkname == undefined && checkalias == undefined )
        console.log(`Unknown command ${cmd}`)
    else console.log(`Command "${cmd}" matched from plugin "${(checkname?checkname:checkalias).plugin}"`)
}