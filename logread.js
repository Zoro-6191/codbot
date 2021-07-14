// this file reads each line from the log
const fs = require('fs')
const { Tail } = require('tail')
const { exit } = require('process')
const ErrorHandler = require('./errorhandler')

module.exports = 
{
    initLogRead
}

async function initLogRead()
{
    const parser = require('./parser.js')
    const { extname } = require('path')

    logpath = require('./conf').mainconfig.server.logfile

    // check if mentioned logfile exists
    if (!fs.existsSync(logpath)) 
        ErrorHandler.fatal(`Logfile doesn't exist: ${logpath}`)

    // check if mentioned logfile has proper extension
    const ext = extname(logpath)
    switch(ext)
    {
        case '.log':
        case '.txt':
        case '.db':
            break;
        default:
            console.error( `\nERROR: Inproper file extension: ${ext}\nBot will shut down.` )
            return exit(1)
    }

    tail = new Tail( logpath )
    tail.on( 'line', (data)=> parser.parseLine(data) )

    console.log(`\nNow Tailing: ${logpath}\n`)
}