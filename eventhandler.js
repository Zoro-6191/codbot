// this file manages all the events and provides accessibility to plugins
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
        db.connection.query( `SELECT guid FROM clients WHERE guid=${guid}`, ( error, result )=>{
            if( error )
                return console.error( error )  // can't skip this. bot has to shut down.
            if( result === undefined )  // nearly impossible
                return console.error(`Unexpected error while emitting Connect event. 
                Query returned undefined when it should have returned atleast empty set in all possible cases. 
                Bot will Shut Down.`)
            else if( result[0] === undefined )  // no match in database
            {
                // here we do pre emission shit like creating basic database entries
                // then updating all info to main client object
                // then emitting 'firstconnect'

                console.log(`While first connect: ${result}`)
                
                player.emit( 'firstconnect', guid, slot, ign ) // event: firstconnect: guid, slot, ign
            }
            else 
            {
                // check database entry integrity?
                // then updating all info to main client object    
                // then emitting 'connect'   
                
                // coz time format in b3 is in 10 digits, which can only be UTC in seconds.
                rightnow = Math.floor(Date.now()/1000)
                
                console.log(`While connect Event: ${result}`)
                // for now error will just be printed on console
                // db.connection.query(`UPDATE clients SET time_edit=${rightnow} WHERE guid=${guid}`, (err)=>{ console.error( `Error while writing info about client to Database in Disconnect Event:
                // ${err}` ) })

                player.emit( 'connect', guid, slot, ign ) // event: connect: guid, slot, ign
            }
        } )
    }
}

async function initPlayerDisconnect( guid, slot, ign )
{
    const db = require('./db')
    // here we firstly change time_edit in clients table 
    // then remove disconnected player from global client object
    // then emitting 'disconnect'


    const { client } = require('./client')
    
    client[toString(slot)] = undefined  // should be enough

    player.emit( 'disconnect', guid, slot, line[3] )
}