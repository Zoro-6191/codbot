// this module manages all the events and provides accessibility to plugins
require('rootpath')()
const { DebugMode } = require('conf')
const ErrorHandler = require('src/errorhandler')
const { groupOperations } = require('utils/groups')

module.exports = 
{
    initEventHandler,
    initPlayerConnect,
    initPlayerDisconnect
}

function initEventHandler()
{
    const events = require('events')

    module.exports.player = new events.EventEmitter()
    module.exports.server = new events.EventEmitter()
    module.exports.bot = new events.EventEmitter()

    if( DebugMode )
        console.log("Initialized: Event Handler")
}

async function initPlayerConnect( guid, slot, ign )
{
    const db = require('utils/db')
    const { rcontool } = require('utils/rcon')
    const { client, updateClientInfo } = require('utils/client')
    
    player = module.exports.player

    const status = await rcontool.rconStatus()
    const onlinePlayers = await status.onlinePlayers
    var match = onlinePlayers.find( zz => zz.num == slot )

    var ip = match.ip
    var steamid = match.steamId

    var clientObj = client.find( cl => cl.slot == slot )

    // check if it's player's first connect of session and first time ever joining the server, and emit 2 unrelated events for it
    if( clientObj == undefined )   // if that slot is empty in our client object, it must mean it's the players first connect of session.
    {
        // now to check if it's player's first ever connection to server, must make mysql query checking guid existance
        const result = await db.pool.query( `SELECT * FROM clients WHERE guid=${guid}`)
            .catch( ErrorHandler.fatal )
        
        if( result[0] === undefined )  // no match in database
        {
            // now we create db entries
            await db.pool.query(`
            INSERT INTO clients 
                ( ip, connections, guid, name, auto_login, time_add ) 
            VALUES ( '${ip}', 1, '${guid}', '${ign}', 1, UNIX_TIMESTAMP() )`)
                .catch( ErrorHandler.fatal )
                .then( res => updateClientInfo( slot, "id", res.insertId ) )    // not 100% sure, but looks like this is it

            updateClientInfo( slot, "noc", 1 )
            updateClientInfo( slot, "group_level", 0 )
            updateClientInfo( slot, "mask_level", 0 )
            updateClientInfo( slot, "time_add", Math.floor(Date.now()/1000) )
            updateClientInfo( slot, "time_edit", 0 )
            updateClientInfo( slot, "greeting", "" )
            updateClientInfo( slot, "ip", ip )
            updateClientInfo( slot, "steamid", steamid )

            // xlr stuff
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

            player.emit( 'firstconnect', guid, slot, ign ) // event: firstconnect: guid, slot, ign
        }
        else    // match in db, entry exists
        {
            // check database entry integrity?
            // then updating all info to main client object    
            // then emitting 'connect'   

            updateClientInfo( slot, "id", result[0].id )
            updateClientInfo( slot, "noc", result[0].connections )
            updateClientInfo( slot, "group_level", groupOperations.BitsToLevel(result[0].group_bits) )
            updateClientInfo( slot, "mask_level", groupOperations.BitsToLevel(result[0].mask_level) )
            updateClientInfo( slot, "time_add", result[0].time_add )
            updateClientInfo( slot, "time_edit", result[0].time_edit )
            updateClientInfo( slot, "greeting", result[0].greeting )

            // now checking if they registered
            
            const xlrResult = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${result[0].id}`)
                .catch(ErrorHandler.fatal)

            if( xlrResult.length )
            {
                updateClientInfo( slot, "registered", true )
                updateClientInfo( slot, "kills", xlrResult[0].kills )
                updateClientInfo( slot, "deaths", xlrResult[0].deaths )
                updateClientInfo( slot, "assists", xlrResult[0].assists )
                updateClientInfo( slot, "tk", xlrResult[0].teamkills )
                updateClientInfo( slot, "teamdeaths", xlrResult[0].teamdeaths )
                updateClientInfo( slot, "suicides", xlrResult[0].suicides )
                updateClientInfo( slot, "ratio", xlrResult[0].ratio )
                updateClientInfo( slot, "roundsplayed", xlrResult[0].rounds )
                updateClientInfo( slot, "skill", xlrResult[0].skill )
                updateClientInfo( slot, "xlrhide", xlrResult[0].hide )
            }
            else
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

            player.emit( 'connect', guid, slot, ign ) // event: connect: guid, slot, ign
        }
    }
}

async function initPlayerDisconnect( guid, slot, ign )
{
    const { client } = require('utils/client')
    player = module.exports.player
    // remove disconnected player from global client object
    // then emitting 'disconnect'

    // console.log(client)
    client.splice( client.indexOf( client.find( clients => clients.slot == slot ) ), 1 )  // should be enough
    // console.log(client)

    console.log(`${ign} disconnected. Slot: ${slot}`);

    player.emit( 'disconnect', guid, slot, ign )
}