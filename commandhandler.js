const ErrorHandler = require('./errorhandler')
const { sendMsg } = require('./msnger')

var prefix, prefix_loud

module.exports = 
{
    init
}

async function init()
{
    const { player } = require('./eventhandler')
    const { rcontool } = require('./rcon')
    const { mainconfig, plugin, command } = require('./conf')

    // firstly we map commands to plugins, done through conf module - done
    // then parse actual commands outta say/sayteam event in this module
    // maybe then even emit a separate event for it like emit('command',slot,cmd,args), maybe not good idea
    // or just point it directly to plugins, better
    // also need to do search slot from player from playername as user types it
    // could point it to individual plugins too, maybe bad idea

    const conf = require('./conf').mainconfig
    prefix = conf.cmd.prefix
    prefix_loud = conf.cmd.prefix_loud

    player.on('say/sayteam', ( guid, slot, ign, content ) => processChatforCMD( guid, slot, ign, content, rcontool, mainconfig, command, plugin ) )
}

async function processChatforCMD( guid, slot, ign, content, rcontool, mainconfig, command, plugin )
{
    // remove extra white spaces from front and back
    // content = content.trim()    
    var mode;

    // teamchat has special blank space everytime, gotta remove it
    if( content[0] == '\x15' )
    {
        content = [...content]
        content.shift()
        content = content.join('')
    }

    // get out if prefix not there
    if( content[0] == prefix )
        mode = 'p'  // 'p' = pm
    else if( content[0] == prefix_loud )
        mode = 'g'  // 'g' = global
    else return // neither of prefixes match

    // now separate command and args
    content = content.split(' ')

    // removal of prefix, for l8r use
    var cmd = [...content[0]]  // make array 
    cmd.shift() // remove prefix
    cmd = cmd.join('')  // make string
    cmd = cmd.toLowerCase()

    // now check if cmd = one of bypassed cmds. return if true
    if( mainconfig.cmd.bypass.includes(cmd) )
        return

    var cmdargs = content
    cmdargs.shift()    // arguments will be an array so any number of args are possible

    // now to find if that command is in any of the plugins' config, even as alias
    // if alias, point to correct command
    
    var checkname = command.find( zz => zz.name == cmd )
    var checkalias = command.find( zz => zz.alias == cmd )

    var commandObj = checkname?checkname:checkalias

    if( checkname == undefined && checkalias == undefined )
        return sendMsg( 'p', slot, plugin.admin.messages.cmd_err_unknown_cmd.replace('%cmd%',cmd) )
    // else console.log(`Command "${cmd}" matched from plugin "${commandObj.plugin}"`)

    // now check if that plugin is enabled
    if( !mainconfig.plugins[commandObj.plugin] )
        return sendMsg( 'p', slot, plugin.admin.messages.cmd_err_plugin_disabled.replace('%cmd%',cmd).replace('%plugin%',commandObj.plugin) )
    
    // now to send command to plugin to execute

    var cmdF = require(`./plugins/${commandObj.plugin}.js`)["cmd_"+commandObj.name]

    if( cmdF == undefined)
    {
        ErrorHandler.warning(`Command Function for command "${commandObj.name}" of plugin "${commandObj.plugin}" not defined.`)
        return sendMsg( 'p', slot, plugin.admin.messages.cmd_err_processing_cmd.replace('%cmd%',cmd) )
    }
    cmdF( slot, mode, cmd, cmdargs )

    // maybe emit an event for it
}