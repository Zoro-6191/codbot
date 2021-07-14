// this file reads all configs (.ini) and then convert them into smart objects

module.exports = 
{
    initConf
}

function initConf()
{
    const fs = require('fs')
    const cjson = require('comment-json')
    const { bot } = require('../eventhandler')

    const mainconfig = cjson.parse(fs.readFileSync('./conf/codbot.json').toString())
    this.mainconfig = mainconfig
    
    bot.emit('config_ready')
    console.log("Initialized: Config")
}