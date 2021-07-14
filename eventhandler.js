// this file manages all the events and provides accessibility to plugins
const ErrorHandler = require('./errorhandler')
var player, server, bot // for local use

module.exports = 
{
    initEventHandler,
    initPlayerConnect,
    initPlayerDisconnect,
    player,
    server,
    bot
}

function initEventHandler()
{
    const events = require('events')

    var player1 = new events.EventEmitter()
    var server1 = new events.EventEmitter()
    var bot1 = new events.EventEmitter()

    module.exports.player = player1
    module.exports.server = server1
    module.exports.bot = bot1

    // for local use
    player = player1
    server = server1
    bot = bot1

    console.log("Initialized: Event Handler")
}

async function initPlayerConnect( guid, slot, ign )
{
    const db = require('./db')
    const { client } = require('./client')

    // check if it's player's first connect of session and first time ever joining the server, and emit 2 unrelated events for it
    if( client[toString(slot)] === undefined )   // if that slot is empty in our client object, it must mean it's the players first connect of session.
    {
        // now to check if it's player's first ever connection to server, must make mysql query checking guid existance
        db.connection.query( `SELECT * FROM clients WHERE guid=${guid}`, ( error, result )=>
        {
            const { updateClientInfo } = require('./client')
            if( error || result === undefined )
                return ErrorHandler.fatal( error? error : `Query returned undefined when it should have returned atleast empty set` )  // can't skip this. bot has to shut down.

            else if( result[0] === undefined )  // no match in database
            {
                // here we do pre emission shit like creating basic database entries and updating all info to main client object

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
                updateClientInfo( slot, "firstconnecttime", result[0].time_add )
                updateClientInfo( slot, "time_edit", result[0].time_edit )
                updateClientInfo( slot, "greeting", result[0].greeting )

                player.emit( 'connect', guid, slot, ign ) // event: connect: guid, slot, ign
            }
        } )
    }
}

async function initPlayerDisconnect( guid, slot, ign )
{
    const db = require('./db')
    const { client } = require('./client')
    // here we firstly change time_edit in clients table 
    // then remove disconnected player from global client object
    // then emitting 'disconnect'

    // time format in b3 is in 10 digits, which can only be UTC in seconds.
    rightnow = Math.floor(Date.now()/1000)

    db.connection.query(`UPDATE clients SET time_edit=${rightnow} WHERE guid=${guid}`, (err)=>{ ErrorHandler.minor( `Error while writing info about client to Database in Disconnect Event:\n${err}` ) })
    
    client[toString(slot)] = undefined  // should be enough

    player.emit( 'disconnect', guid, slot, ign )
}