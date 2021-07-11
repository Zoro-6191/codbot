// commands: xlrstats, xlrhide, xlrtopstats

const db = require('./db')
const { player } = require('./evenhandler')
const { client, updateClientInfo } = require('../client')

module.exports = 
{
    name: 'XLR Plugin',
    description: `Used to store K/D of players.`,
    init
}

async function init()
{
    
}