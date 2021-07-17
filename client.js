// this file stores and updates currently playing clients based on their slot
const db = require('./db')
const ErrorHandler = require('./errorhandler')

module.exports = 
{
    init,
    updateClientInfo
}

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
        updateClientInfo( slot, "score", onlinePlayers[i].score )
        updateClientInfo( slot, "ping", onlinePlayers[i].ping )
        updateClientInfo( slot, "guid", onlinePlayers[i].id )
        updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
        updateClientInfo( slot, "ip", onlinePlayers[i].ip )
    }

    // player = eventhandler.player
    const player = require('./eventhandler').player
    // console.log(eventhandler)

    // now we begin with events
    player.on( 'firstconnect', ( guid, slot, ign ) => onFirstConnect( guid, slot, ign ) )
    player.on( 'connect', ( guid, slot, ign ) => onConnect( guid, slot, ign ) )
    // player.on( 'disconnect', ( guid, slot, ign ) => onDisconnect( guid, slot, ign ) )
}

async function onFirstConnect( guid, slot, ign )
{
    const { rcontool } = require('./rcon')

    const status = await rcontool.rconStatus()
    const onlinePlayers = await status.onlinePlayers
    var match = onlinePlayers.find( zz => zz.num == slot )

    var ip = match.ip
    var steamid = match.steamId

    // now we create db entries

    // db.connection.query(
    //     `INSERT INTO clients
    //     ( ip, connections, guid, pb_id, name, time_add )
    //     VALUES ( )`)

    updateClientInfo( slot, "name", ign )
    updateClientInfo( slot, "guid", guid )
    updateClientInfo( slot, "noc", 1 )
    updateClientInfo( slot, "group_bits", 0 )
    updateClientInfo( slot, "mask_level", 0 )
    updateClientInfo( slot, "time_add", Math.floor(Date.UTC()/1000) )
    updateClientInfo( slot, "time_edit", 0 )
    updateClientInfo( slot, "greeting", "" )
    updateClientInfo( slot, "ip", ip )
    updateClientInfo( slot, "steamid", steamid )

    console.log(client["s"+slot])
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
            updateClientInfo( slot, "score", onlinePlayers[i].score )
            updateClientInfo( slot, "ping", onlinePlayers[i].ping )
            updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
            updateClientInfo( slot, "ip", onlinePlayers[i].ip )
        }

    // now fetching info from query
    // aliascount, penaltiescount, ipaliascount
    // kills, deaths, assists, tk, teamdeaths, suicides, roundsplayed, ratio, skill, winstreak, losestreak, xlrhide from xlr_playerstats

    // console.log(module.exports.client)
    db.connection.query(`SELECT * FROM xlr_playerstats WHERE client_id=${ module.exports.client["s"+slot].id }`, ( error, result ) => 
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
        console.log(module.exports.client)
    })
}

async function updateClientInfo( slot, str, value )
{
    if( module.exports.client == undefined )
        module.exports.client = {}

    if( module.exports.client["s"+slot] == undefined )
        module.exports.client["s"+slot] = {}

    if( slot == undefined || str == undefined || value == undefined )
        return ErrorHandler.minor(`Error in updateClientInfo(): one of the args was undefined.\nSLOT: ${slot}\nProperty: ${str}\nValue: ${value}`)

    module.exports.client["s"+slot][str] = value
}