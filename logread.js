// this file reads each line from the log
const { Tail } = require('tail')
const parser = require('./parser.js')
const conf = require('./conf')

module.exports = 
{
    init
}

async function init()
{
    console.log('Starting Tail')
    console.log( conf.mainconfig.server )
    tail = new Tail( conf.mainconfig.server.logfile )

    tail.on('line', (data)=>{
        // console.log(data)
        parser.parseLine(data)
    })
}