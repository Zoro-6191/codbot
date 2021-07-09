// this file reads each line from the log
const { Tail } = require('tail')
const parser = require('./parser.js')

module.exports = 
{
    init
}

async function init()
{
    console.log('Starting Tail')
    tail = new Tail('H://Games/Call\ of\ Duty\ Modern\ Warfare/mods/vf_snr_promod-ranked/games_mp.log')

    tail.on('line', (data)=>{
        // console.log(data)
        parser.parseLine(data)
    })
}