// this file reads all configs (.ini) and then convert them into smart objects
const ErrorHandler = require('../errorhandler')

module.exports = 
{
    initConf
}

function initConf()
{
    const fs = require('fs')
    const cjson = require('comment-json')
    const { bot } = require('../eventhandler')

    // JSON Syntax check
    try
    {
        const mainconfig = cjson.parse(fs.readFileSync('./conf/codbot.json').toString())
        this.mainconfig = mainconfig
    }
    catch(e)
    {
        ErrorHandler.fatal(`Incorrect JSON Syntax found in file: /conf/codbot.json\n${e}`)
    }

    bot.emit('config_ready')
    console.log("Initialized: Config")
}