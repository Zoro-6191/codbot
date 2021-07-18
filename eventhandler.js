// this file manages all the events and provides accessibility to plugins
const ErrorHandler = require('./errorhandler')

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

    console.log("Initialized: Event Handler")
}

async function initPlayerConnect( guid, slot, ign )
{
    const db = require('./db')
    const { rcontool } = require('./rcon')
    const { client, updateClientInfo } = require('./client')
    
    player = module.exports.player

    const status = await rcontool.rconStatus()
    const onlinePlayers = await status.onlinePlayers
    var match = onlinePlayers.find( zz => zz.num == slot )

    var ip = match.ip
    var steamid = match.steamId

    // check if it's player's first connect of session and first time ever joining the server, and emit 2 unrelated events for it
    if( client["s"+slot] == undefined )   // if that slot is empty in our client object, it must mean it's the players first connect of session.
    {
        // now to check if it's player's first ever connection to server, must make mysql query checking guid existance
        db.connection.query( `SELECT * FROM clients WHERE guid=${guid}`, ( error, result )=>
        {
            if( error || result === undefined )
                return ErrorHandler.fatal( error? error : `Query returned undefined when it should have returned atleast empty set` )  // can't skip this. bot has to shut down.

            else if( result[0] === undefined )  // no match in database
            {
                // now we create db entries

                db.connection.query(`INSERT INTO clients ( ip, connections, guid, name, time_add ) 
                    VALUES ( '${ip}', 1, '${guid}', '${ign}', UNIX_TIMESTAMP() )`, ( err, result )=>
                    {
                        if(err)
                            ErrorHandler.fatal(err)
                        else updateClientInfo( slot, "id", result.insertId )    // not 100% sure, but looks like this is it
                    })

                updateClientInfo( slot, "noc", 1 )
                updateClientInfo( slot, "group_bits", 0 )
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
                updateClientInfo( slot, "group_bits", result[0].group_bits )
                updateClientInfo( slot, "mask_level", result[0].mask_level )
                updateClientInfo( slot, "time_add", result[0].time_add )
                updateClientInfo( slot, "time_edit", result[0].time_edit )
                updateClientInfo( slot, "greeting", result[0].greeting )

                player.emit( 'connect', guid, slot, ign ) // event: connect: guid, slot, ign
            }
            // console.log(client)
        } )
        // console.log(`${ign} connected. Slot: ${slot}`);
    }
}

async function initPlayerDisconnect( guid, slot, ign )
{
    const db = require('./db')
    const { client } = require('./client')
    player = module.exports.player
    // here we firstly change time_edit in clients table 
    // then remove disconnected player from global client object
    // then emitting 'disconnect'

    // time format in b3 is in 10 digits, which can only be UTC in seconds.
    // rightnow = Math.floor(Date.now()/1000)

    // db.connection.query(`UPDATE clients SET time_edit=${rightnow} WHERE guid=${guid}`, (err)=>{ ErrorHandler.minor( `Error while writing info about client to Database in Disconnect Event:\n${err}` ) })

    client["s"+slot] = undefined  // should be enough

    console.log(`${ign} disconnected. Slot: ${slot}`);

    player.emit( 'disconnect', guid, slot, ign )
}