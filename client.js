// this client stores and updates currently playing clients based on their slot
const db = require('./db')

module.exports = 
{
    init,
    updateClientInfo
}

async function init()
{
    client = {} // for simplicity

    // get current players and update to client object
    const { rcon } = require('./rcon')
    const status = await rcon.rconStatus()
    const onlinePlayers = await status.onlinePlayers
 
    // console.log(onlinePlayers)

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
    this.client = client    // now module.exports.client is an object containing info about our online players

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

    const { rcon } = require('./rcon')
    const status = await rcon.rconStatus()
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
    // db_id, noc, group_bits, mask_level, greeting, time_add, time_edit from clients table
    // aliascount, penaltiescount, ipaliascount
    // kills, deaths, assists, tk, teamdeaths, suicides, roundsplayed, ratio, skill, winstreak, losestreak, xlrhide from xlr_playerstats


    // from clients table
    await db.connection.query(`
        SELECT kills,
                deaths,
                assists,
                teamkills,
                teamdeaths,
                suicides,
                ratio,
                skill
        FROM xlr_playerstats
        WHERE client_id=${ module.exports.client[toString(slot)].id }`, ( error, result ) => 
    {
        if( error )
            console.error( error )  // can't skip this. bot has to shut down.
        if( result === undefined )  // nearly impossible
            console.error(`Unexpected error while Connect event in client.js. 
            Query returned undefined when it should have returned atleast empty set in all possible cases. 
            Bot will Shut Down.`)
        // now result[0] cant be undefined coz event is 'connect' not 'firstconnect'
        updateClientInfo( slot, "kills", result[0].kills )
        updateClientInfo( slot, "deaths", result[0].deaths )
        updateClientInfo( slot, "assists", result[0].assists )
        updateClientInfo( slot, "tk", result[0].teamkills )
        updateClientInfo( slot, "teamdeaths", result[0].teamdeaths )
        updateClientInfo( slot, "suicides", result[0].suicides )
        updateClientInfo( slot, "ratio", result[0].ratio )
        updateClientInfo( slot, "skill", result[0].skill )

        console.log( module.exports.client[toString(slot)])
    })
}

async function updateClientInfo( slot, str, value )
{
    if( module.exports.client == undefined )
        module.exports.client = {}

    if( module.exports.client[toString(slot)] == undefined )
        module.exports.client[toString(slot)] = {}

    if( slot == undefined || str == undefined || value == undefined )
        return console.error(`Error in updateClientInfo(): one of the args was undefined.\nSLOT: ${slot}\nProperty: ${str}\nValue: ${value}`)

    module.exports.client[toString(slot)][str] = value
}