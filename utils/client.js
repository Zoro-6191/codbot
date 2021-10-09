// this file stores and updates currently playing clients based on their slot
const db = require.main.require('./utils/db')
const ErrorHandler = require.main.require('./src/errorhandler')

// for local use
var client

module.exports = 
{
    init,
    isSlotFilled,
    getClientInfo,
    getClientObj,
    updateClientInfo,
    getPlayerByNameToken
}

// TO-DO: aliascount, assists, deaths, ipaliascount, kills, ratio, roundsplayed, skill, suicides, teamdeaths, tk

// ======= client object:
// [
//  // each player has one of these
//     {
//         aliascount:
//         assists:
//         deaths:
//         id:
//         ip:
//         ipaliascount:
//         kills:
//         greeting:
//         group_level:
//         guid:
//         last_ip:
//         last_name:
//         losestreak:
//         name:
//         noc:
//         masked_level:
//         ping:
//         ratio:
//         registered:
//         roundsplayed:
//         score:
//         skill:
//         slot:
//         steamid:
//         suicides:
//         teamdeaths:
//         time_add:
//         time_edit:
//         tk:
//         winstreak:
//         xlrhide:
//     },
// ]

async function init()
{
    if( module.exports.client == undefined )
    {
        client = [] // for simplicity
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
        
        updateClientInfo( slot, "slot", slot )
        updateClientInfo( slot, "name", onlinePlayers[i].name )
        updateClientInfo( slot, "score", onlinePlayers[i].score )   // needed?
        updateClientInfo( slot, "ping", onlinePlayers[i].ping )
        updateClientInfo( slot, "guid", onlinePlayers[i].id )
        updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
        updateClientInfo( slot, "ip", onlinePlayers[i].ip )
    }
    // TO-DO: update database stuff right here and now too
    // can be a bit heavy but should work

    const player = require('../src/eventhandler').player

    // now we begin with events
    player.on( 'connect', ( guid, slot, ign ) => onConnect( guid, slot, ign ) )
    // player.on( 'disconnect', ( guid, slot, ign ) => onDisconnect( guid, slot, ign ) )
}

async function onConnect( guid, slot, ign )
{
    // here we add all info to client object of module.exports
    // including query fetched info
    updateClientInfo( slot, "slot", slot )  // i know
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
    
    var clientObj = await getClientObj( slot )
    // now fetching info from query
    // aliascount, penaltiescount, ipaliascount
    // kills, deaths, assists, tk, teamdeaths, suicides, roundsplayed, ratio, skill, winstreak, losestreak, xlrhide from xlr_playerstats

    const result = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${ clientObj.id }`)
        .catch( ErrorHandler.fatal )

    // now result[0] cant be undefined coz event is 'connect' not 'firstconnect'
    if( result.length )  // player registered
    {
        updateClientInfo( slot, "registered", true )
        updateClientInfo( slot, "kills", result[0].kills )
        updateClientInfo( slot, "deaths", result[0].deaths )
        updateClientInfo( slot, "assists", result[0].assists )
        updateClientInfo( slot, "tk", result[0].teamkills )
        updateClientInfo( slot, "teamdeaths", result[0].teamdeaths )
        updateClientInfo( slot, "suicides", result[0].suicides )
        updateClientInfo( slot, "ratio", result[0].ratio )
        updateClientInfo( slot, "roundsplayed", result[0].rounds )
        updateClientInfo( slot, "skill", result[0].skill )
        updateClientInfo( slot, "xlrhide", result[0].hide )
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
        updateClientInfo( slot, "roundsplayed", 0 )
        updateClientInfo( slot, "skill", 1000.0 )
        updateClientInfo( slot, "xlrhide", 0 )
    }
    console.log(client)
}

// get whole clientObj of 1 player matching by slot
async function getClientObj( slot )
{
    if( client == undefined )
        return undefined
    
    // TO-DO: improve from .find()?
    var clientObj = client.find( client => client.slot == slot )
    
    if( clientObj == undefined )
        return undefined

    return clientObj
}

// return 1 property of the clientObj which matches the slot
async function getClientInfo( slot, property )
{
    if( client == undefined )
        return undefined

    var clientObj = client.find( client => client.slot == slot )
        
    if( clientObj == undefined )
        return undefined
        
    return clientObj[property]
}

async function getPlayerByNameToken( token )
{
    if( client == undefined )
        return undefined

    token = token.toLowerCase()
    token = removeSpaces(token)

    var resultsFound = []

    for( var i = 0; i < client.length; i++ )
    {
        var nameTok = client[i].name.toLowerCase()

        nameTok = removeSpaces(nameTok)
        
        if( nameTok.includes(token) )
            resultsFound.push( client[i].slot )
    }

    return resultsFound
}

async function removeSpaces(str)
{
    for( var j = 0; j < str.length; j++ )
    {
        if( str[j] == ' ' )
            str.splice(j,1)
    }
    return str
}

async function isSlotFilled( slot )
{
    if( client == undefined )
        return false
    
    // TO-DO: improve from .find()?
    var clientObj = client.find( client => client.slot == slot )
    
    if( clientObj == undefined )
        return false

    return true
}

// update 1 property of the clientObj which matches slot
async function updateClientInfo( slot, property, value )
{
    if( client == undefined )
        client = []

    var clientObj = client.find( client => client.slot == slot )

    // create new entry if empty
    if( clientObj == undefined )
    {
        client[client.length] = {}
        clientObj = client[client.length-1]
        clientObj.slot = slot
    }

    if( slot == undefined || property == undefined || value == undefined )
        return ErrorHandler.minor(`Error in updateClientInfo(): one of the args was undefined.\nSLOT: ${slot}\nProperty: ${property}\nValue: ${value}`)

    clientObj[property] = value
}