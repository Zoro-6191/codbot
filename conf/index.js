// this file reads all configs (.ini) and then convert them into smart objects
const cjson = require('comment-json')
const fs = require('fs')
const { extname } = require('path')
const ErrorHandler = require('../errorhandler')

module.exports = 
{
    initConf
}

function initConf()
{
    const { bot } = require('../eventhandler')
    const mainConfPath = './conf/codbot.json'

    if( !fs.existsSync(mainConfPath) )
        ErrorHandler.fatal(`Main Config File "${mainConfPath}" not found`)

    // JSON Syntax check
    try
    {
        const mainconfig = cjson.parse(fs.readFileSync(mainConfPath).toString())
        this.mainconfig = mainconfig
    }
    catch(e)
    {
        ErrorHandler.fatal(`Incorrect JSON Syntax found in file: /conf/codbot.json\n${e}`)
    }

    // now to read every other file except codbot.json and index.js
    // or take file names from ../plugins, map them to plugin_(name).json, better
    // then parse it to objects
    // store in global objects for use

    var plugin = {}

    const pluginArr = fs.readdirSync( `./plugins/` )
    // remove index.js
    // splice( index, <deletecount> ) = delete specific element(s) from array
    pluginArr.splice( pluginArr.indexOf('index.js'),1)

    // now to create workable objects of their configs
    for( i=0; i<pluginArr.length; i++ )
    {
        // remove elements which don't end with .js
        const ext = extname(`./plugins/${pluginArr[i]}`)
        if(ext.toLowerCase()!='.js')
            pluginArr.splice(i,1)

        var pluginName = pluginArr[i].split('.js')[0]
        var pluginConfPath = `./conf/plugin_${pluginName}.json`

        // some plugins may work without configs
        if( !fs.existsSync(pluginConfPath) )
        {
            plugin[pluginName] = {}
            continue
        }
        // plugin to config mapping
        try
        {
            plugin[pluginName] = cjson.parse(fs.readFileSync(`./conf/plugin_${pluginName}.json`).toString()) 
        }
        catch(e)
        {
            ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${pluginConfPath}\n${e}`)
        }
    }
    module.exports.plugin = plugin

    // console.log(pluginArr.length)
    // console.log(pluginArr)

    // now to create command object
    command = {}
    // command obj will have
    // name:
    // alias?:
    // minpower
    // help:
    // usage:
    // plugin:
    // plugin prop will be used to point the command to that plugin

    // console.log(this.plugin)

    // foreach is about 5x slower compared to for
    // but it would probably take 25x lines of code to write following in for :(
    Object.keys(plugin).forEach( pl =>
    {
        // console.log( plugin[pl].name )
        if( plugin[pl].commands == undefined )
            return
        
        Object.keys( plugin[pl].commands ).forEach( cmd =>
            {
                // console.log( `${cmd}: ` + plugin[pl].commands[cmd])

                command[cmd] = {}
                
                command[cmd].minpower = plugin[pl].commands[cmd]
                command[cmd].plugin = pl
            })

        // for command alias
        if( plugin[pl].commandalias!=undefined )
            Object.keys( plugin[pl].commandalias ).forEach( cmd =>
                {
                    if( command[cmd] == undefined )
                        return

                    // console.log(`Alias for "${cmd}": "${plugin[pl].commandalias[cmd]}"`)
                    command[cmd].alias = plugin[pl].commandalias[cmd]
                })

        // for command help
        Object.keys( plugin[pl].commandhelp ).forEach( cmd =>
            {
                if( command[cmd] == undefined )
                    return
                
                if( plugin[pl].commandhelp[cmd] == undefined )
                    ErrorHandler.minor(`Warning: Help message not configured for command "${cmd}" of plugin "${pl}".\nYou need to specify it in "commandhelp" section of "conf/plugin_${pl}.json"`)

                command[cmd].help = plugin[pl].commandhelp[cmd]
            })

        // for command usage
        Object.keys( plugin[pl].commandhelp ).forEach( cmd =>
            {
                if( command[cmd] == undefined )
                    return
                
                if( plugin[pl].commandusage[cmd] == undefined )
                    ErrorHandler.minor(`Warning: Command Usage not specified for command "${cmd}" of plugin "${pl}".\nYou need to specify it in "commandusage" section of "conf/plugin_${pl}.json"`)

                command[cmd].usage = plugin[pl].commandusage[cmd]
            })
    })
    module.exports.command = command

    bot.emit('config_ready')
    console.log("Initialized: Config")
}