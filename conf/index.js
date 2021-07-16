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
        if(ext!='.js')
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
    // console.log(pluginArr.length)
    // console.log(pluginArr)

    


    // console.log( plugin )

    bot.emit('config_ready')
    console.log("Initialized: Config")
}