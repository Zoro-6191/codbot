// this module manages all the events and provides accessibility to plugins
const { DebugMode } = require.main.require('./conf')
const ErrorHandler = require.main.require('./src/errorhandler')
const { groupOperations } = require.main.require('./utils/groups')

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
    const db = require.main.require('./utils/db')
    const { rcontool } = require.main.require('./utils/rcon')
    const { client, updateClientInfo } = require.main.require('./utils/client')
    
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
        db.pool.query( `SELECT * FROM clients WHERE guid=${guid}`, ( error, result )=>
        {
            if( error || result === undefined )
                return ErrorHandler.fatal( error? error : `Query returned undefined when it should have returned atleast empty set` )  // can't skip this. bot has to shut down.

            
            else if( result[0] === undefined )  // no match in database
            {
                // now we create db entries

                db.pool.query(`INSERT INTO clients ( ip, connections, guid, name, time_add ) 
                    VALUES ( '${ip}', 1, '${guid}', '${ign}', UNIX_TIMESTAMP() )`, ( err, result )=>
                    {
                        if(err)
                            ErrorHandler.fatal(err)
                        else updateClientInfo( slot, "id", result.insertId )    // not 100% sure, but looks like this is it
                    })

                updateClientInfo( slot, "noc", 1 )
                updateClientInfo( slot, "group_level", 0 )
                updateClientInfo( slot, "mask_level", 0 )
                updateClientInfo( slot, "time_add", Math.floor(Date.now()/1000) )
                updateClientInfo( slot, "time_edit", 0 )
                updateClientInfo( slot, "greeting", "" )
                updateClientInfo( slot, "ip", ip )
                updateClientInfo( slot, "steamid", steamid )

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
                updateClientInfo( slot, "mask_level", result[0].mask_level )
                updateClientInfo( slot, "time_add", result[0].time_add )
                updateClientInfo( slot, "time_edit", result[0].time_edit )
                updateClientInfo( slot, "greeting", result[0].greeting )

                player.emit( 'connect', guid, slot, ign ) // event: connect: guid, slot, ign
            }
        } )
    }
}

async function initPlayerDisconnect( guid, slot, ign )
{
    const { client } = require.main.require('./utils/client')
    player = module.exports.player
    // remove disconnected player from global client object
    // then emitting 'disconnect'

    // console.log(client)
    client.splice( client.indexOf( client.find( clients => clients.slot==slot ) ), 1 )  // should be enough
    // console.log(client)

    console.log(`${ign} disconnected. Slot: ${slot}`);

    player.emit( 'disconnect', guid, slot, ign )
}