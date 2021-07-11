// this file reads all configs (.ini) and then convert them into smart objects
const fs = require('fs')
const ini = require('ini')

module.exports = 
{
    init
}

async function init()
{
    const mainconfig = ini.parse(fs.readFileSync('./codbot.ini', 'utf-8'))
    module.exports.mainconfig = mainconfig

    // read all other .ini separately and store them in a smart way somehow.
}