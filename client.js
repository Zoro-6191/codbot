// this client stores and updates currently playing clients based on their slot
const db = require('./db')
const { rcon } = require('./rcon')
const { player } = require('./eventhandler')

module.exports = 
{
    init,
    updateClientInfo
}

async function init()
{
    client = {} // for simplicity

    // get current players and update to client object
    const status = await rcon.status()
    const onlinePlayers = status.onlinePlayers

    for( i=0; i < status.sv_maxclients; i++ )   // maybe using maxclients here can cause problem if server is full and private clients connect, later.
    {
        j = toString(i)
        client[j].name = onlinePlayers[i].name
        client[j].score = onlinePlayers[i].score
        client[j].ping = onlinePlayers[i].ping
        client[j].guid = onlinePlayers[i].id
        client[j].ip = onlinePlayers[i].ip
        client[j].steamid = onlinePlayers[i].steamId
    }
    module.exports.client = client
}

async function updateClientInfo( client, str, value )
{
    module.exports.client[str] = value
}

// TO-DO: emit 'firstconnect' of player