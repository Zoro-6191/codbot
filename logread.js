// this file reads each line from the log
const fs = require('fs')
const { Tail } = require('tail')
const parser = require('./parser.js')
const conf = require('./conf')
const { exit } = require('process')

module.exports = 
{
    initLogRead
}

async function initLogRead()
{
    logpath = conf.mainconfig.server.logfile
    if (!fs.existsSync(logpath)) 
    {
        console.error( `
        ERROR: Logfile doesn't exist: ${logpath}
        ` )
        return exit(1)
    }
    tail = new Tail( logpath )

    tail.on( 'line', (data)=>{
        // console.log(data)
        parser.parseLine(data)
    })
    console.log(`Initialized: LogRead`)
}