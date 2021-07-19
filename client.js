// this file stores and updates currently playing clients based on their slot
const db = require('./db')
const ErrorHandler = require('./errorhandler')

module.exports = 
{
    init,
    getClientInfo,
    updateClientInfo
}

// ======= client object:
//
// s0: {
//     assists:
//     deaths:
//     id:
//     ip:
//     kills:
//     greeting:
//     group_bits:
//     group_level:
//     group_name:
//     group_token:
//     guid:
//     last_ip:
//     last_name:
//     name:
//     noc:
//     masked_level:
//     ping:
//     ratio:
//     registered:
//     score:
//     skill:
//     steamid:
//     suicides:
//     teamdeaths:
//     time_add:
//     time_edit:
//     tk:
// }

async function init()
{
    if( module.exports.client == undefined )
    {
        client = {} // for simplicity
        module.exports.client = client
    }

    // get current players and update to client object
    const { rcontool } = require('./rcon')
    const status = await rcontool.rconStatus()

    // if server offline, for now just crash
    if( !(await status.online) )
        return ErrorHandler.fatal(`COD4 Server not online`)
    else rcontool.say(`^1[^3CODBOT^1] ^2Started.\n^7Made by ^2Zoro`)

    const onlinePlayers = await status.onlinePlayers

    for( i=0; i < onlinePlayers.length; i++ )
    {
        var slot = onlinePlayers[i].num    // we need slot num which is always unordered in
        updateClientInfo( slot, "name", onlinePlayers[i].name )
        updateClientInfo( slot, "score", onlinePlayers[i].score )   // needed?
        updateClientInfo( slot, "ping", onlinePlayers[i].ping )
        updateClientInfo( slot, "guid", onlinePlayers[i].id )
        updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
        updateClientInfo( slot, "ip", onlinePlayers[i].ip )
    }

    // player = eventhandler.player
    const player = require('./eventhandler').player
    // console.log(eventhandler)

    // now we begin with events
    player.on( 'connect', ( guid, slot, ign ) => onConnect( guid, slot, ign ) )
    // player.on( 'disconnect', ( guid, slot, ign ) => onDisconnect( guid, slot, ign ) )
}

async function onConnect( guid, slot, ign )
{
    // here we add all info to client object of module.exports
    // including query fetched info
    updateClientInfo( slot, "name", ign )
    updateClientInfo( slot, "guid", guid ) 

    const { rcontool } = require('./rcon')
    const status = await rcontool.rconStatus()
    const onlinePlayers = await status.onlinePlayers

    for( i=0; i < onlinePlayers.length; i++ )
        if( onlinePlayers[i].num == slot )
        {
            updateClientInfo( slot, "score", onlinePlayers[i].score )   // needed?
            updateClientInfo( slot, "ping", onlinePlayers[i].ping )
            updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
            updateClientInfo( slot, "ip", onlinePlayers[i].ip )
        }

    // now fetching info from query
    // aliascount, penaltiescount, ipaliascount
    // kills, deaths, assists, tk, teamdeaths, suicides, roundsplayed, ratio, skill, winstreak, losestreak, xlrhide from xlr_playerstats

    // console.log(module.exports.client)
    db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${ module.exports.client["s"+slot].id }`, ( error, result ) => 
    {
        if( error )
            ErrorHandler.fatal( error )  // can't skip this. bot has to shut down.
        if( result === undefined )  // nearly impossible
            ErrorHandler.fatal(`Unexpected error while Connect event in client.js. 
            Query returned undefined when it should have returned atleast empty set in all possible cases. 
            Bot will Shut Down.`)
        // now result[0] cant be undefined coz event is 'connect' not 'firstconnect'
        if( result[0]!=undefined )  // player registered
        {
            updateClientInfo( slot, "registered", true )
            updateClientInfo( slot, "kills", result[0].kills )
            updateClientInfo( slot, "deaths", result[0].deaths )
            updateClientInfo( slot, "assists", result[0].assists )
            updateClientInfo( slot, "tk", result[0].teamkills )
            updateClientInfo( slot, "teamdeaths", result[0].teamdeaths )
            updateClientInfo( slot, "suicides", result[0].suicides )
            updateClientInfo( slot, "ratio", result[0].ratio )
            updateClientInfo( slot, "skill", result[0].skill )
        }
        else    // player not registered
        {
            updateClientInfo( slot, "registered", false )
            updateClientInfo( slot, "kills", 0 )
            updateClientInfo( slot, "deaths", 0 )
            updateClientInfo( slot, "assists", 0 )
            updateClientInfo( slot, "tk", 0 )
            updateClientInfo( slot, "teamdeaths", 0 )
            updateClientInfo( slot, "suicides", 0 )
            updateClientInfo( slot, "ratio", 1.0 )
            updateClientInfo( slot, "skill", 1000.0 )
        }
    })
}

async function getClientInfo( slot, property )
{
    if( module.exports.client == undefined )
        return undefined
        
    if( module.exports.client["s"+slot] == undefined )
        return undefined
        
    return module.exports.client["s"+slot][property]
}

async function updateClientInfo( slot, property, value )
{
    if( module.exports.client == undefined )
        module.exports.client = {}

    if( module.exports.client["s"+slot] == undefined )
        module.exports.client["s"+slot] = {}

    if( slot == undefined || property == undefined || value == undefined )
        return ErrorHandler.minor(`Error in updateClientInfo(): one of the args was undefined.\nSLOT: ${slot}\nProperty: ${str}\nValue: ${value}`)

    module.exports.client["s"+slot][property] = value
}