// this file reads all configs (.ini) and then convert them into smart objects
const fs = require('fs')
const cjson = require('comment-json')

const eventhandler = require('../eventhandler')

module.exports = 
{
    init
}

function init()
{
    // console.log("Initializing Config")
    const mainconfig = cjson.parse(fs.readFileSync('./conf/codbot.json').toString())
    this.mainconfig = mainconfig

    // console.log( mainconfig )
    // console.log( mainconfig.mysqldb )
    // console.log( mainconfig.mysqldb.host )
    
    // read all other .ini separately and store them in a smart way somehow.
    eventhandler.bot.emit('conf_ready')

    // console.log("Initializing Config Complete")
}