// this file parses each line and makes use outta em
// events appear to be the best option for independent and togglable plugins

const { player, server } = require('./eventhandler')
const { client } = require('./client')
const db = require('./db.js')

module.exports = 
{
    parseLine
}

async function parseLine( line )
{
    // types of lines to process:
    // 0.00 = minutes and seconds from server start, probably
    // 0.00 -----------------------             // idk
    // 0.00 InitGame: \fs_game\mods/...              // big ass line, but contains good amounta info
    // 0.00 J;<guid>;<slot>;<name>                   // player connect
    // 0.00 Q;<guid>;<slot>;<name>                   // player disconnect
    // 0.00 D;<guid>;<slot>;<team>;<name>;<att_guid>;<att_slot>;<att_team>;<att_name>;<weap>;<dmg>;<meansofdeath>;<hitloc>   // attacker inflicting dmg to our boy
    // 0.00 K;<guid>;<slot>;<team>;<name>;<att_guid>;<att_slot>;<att_team>;<att_name>;<weap>;<dmg>;<meansofdeath>;<hitloc>   // attacker killed our boy
    // 0.00 P_P;<guid>;<slot>;<name>                 // player plant
    // 0.00 P_D;<guid>;<slot>;<name>                 // player defuse
    // 0.00 say;<guid>;<slot>;<name>;<text>         // saytext wihtout quotes
    // 0.00 sayteam;<guid>;<slot>;<name>;<text>    // say team text wihtout quotes
    // 0.00 Weapon;<guid>;<slot>;<name>;<weapon>    // weap pickup log
    // 0.00 ExitLevel: executed                      // exitlevel called, basically endmap

    // trim() = remove extra white spaces from start and end
    // split(" ") = create an array outta sentence diff by " "
    // slice(1) = remove 1st element of that array  // shift() malfunctioned
    // join(" ") = join the array and remake it a string, separated by " ". we need the space in case player name has space
    line = line.trim().split(" ").slice(1).join(" ")    // remove timestamp coz no need
    
    // J;<guid>;<slot>;<name>                   // player connect
    // [ 'J', '273546t762', 8, 'optical prime' ]

    if( line.startsWith('InitGame') || line.startsWith('ExitLevel') || line.startsWith('--'))
        processServerLines(line)
    else
    {
        line = line.split(";")

        // these 2 are common in all cases
        guid = line[1]
        slot = line[2]
        // TO-DO: check correctness of all linesubstr elements

        // luckily first word/alphabet is diff in every case, could just do switch
        
        switch( line[0] )
        {
            case 'J':
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
                            return player.emit( 'firstconnect', guid, slot, line[3] ) // event: firstconnect: guid, slot, ign
                        else return player.emit( 'connect', guid, slot, line[3] ) // event: connect: guid, slot, ign
                    } )
                }
                return;

            case 'Q':
                // event: disconnect, guid, slot, name
                player.emit( 'disconnect', guid, slot, line[3] )
                return;

            case 'D':
                // event: damage, guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc
                // TO-DO: emit suicide event
                player.emit( 'damage', guid, slot, line[3], line[4], line[5], line[6], line[7], line[8], line[9], line[10], line[11], line[12] )
                return;
            
            case 'K':
                // event: kill, guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc
                // TO-DO: emit tk event
                player.emit( 'kill', guid, slot, line[3], line[4], line[5], line[6], line[7], line[8], line[9], line[10], line[11], line[12] )
                return;

            case 'say':
            case 'sayteam':
                processChat( line )
                return;

            case 'P_P':
                player.emit( 'plant', guid, slot, line[3] )
                return;

            case 'P_D':
                player.emit( 'defuse', guid, slot, line[3] )
                return;

            case 'Weapon':
                player.emit( 'weapPick', guid, slot, line[3], line[4] )
                return;
        }
    }
}

async function processChat( line )
{
    // need to append chat line in case it contains ";"
    if( line.length > 5 )
    line[4] = line.slice(4).join(';')

    // emit event. line[0] could only be either 'say' or 'sayteam' so its safe to do this
    player.emit( line[0], line[1], line[2], line[3], line[4] )

    // and an event which includes both say and sayteam for shit like commands
    player.emit( 'say/sayteam', line[1], line[2], line[3], line[4] )
}

async function processServerLines(line)
{
    if(line.startsWith('InitGame'))
    {
        server.emit( 'roundstart' )
        server.emit( 'initgame', line )
    }
    else if( line.startsWith('ExitLevel') )
        server.emit( 'endmap' )
}