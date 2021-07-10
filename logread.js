// this file reads each line from the log
const { Tail } = require('tail')
const parser = require('./parser.js')
const { logpath } = require('./config.json')

module.exports = 
{
    init
}

async function init()
{
    console.log('Starting Tail')
    tail = new Tail( logpath )

    tail.on('line', (data)=>{
        // console.log(data)
        parser.parseLine(data)
    })
}