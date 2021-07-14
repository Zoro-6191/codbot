// this file parses each line and makes use outta em
// events appear to be the best option for independent and togglable plugins

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

        const eventhandler = require('./eventhandler')
        
        switch( line[0] )
        {
            case 'J':
                // forward to event handler
                eventhandler.initPlayerConnect( guid, slot, line[3] )
                return;
4
            case 'Q':
                // forward to event handler
                eventhandler.initPlayerDisconnect( guid, slot, line[3] )
                return;

            case 'D':
                // event: damage, guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc
                // TO-DO: emit suicide event
                eventhandler.player.emit( 'damage', guid, slot, line[3], line[4], line[5], line[6], line[7], line[8], line[9], line[10], line[11], line[12] )
                return;
            
            case 'K':
                // event: kill, guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc
                // TO-DO: emit tk event
                eventhandler.player.emit( 'kill', guid, slot, line[3], line[4], line[5], line[6], line[7], line[8], line[9], line[10], line[11], line[12] )
                return;

            case 'say':
            case 'sayteam':
                processChat( line )
                return;

            case 'P_P':
                eventhandler.player.emit( 'plant', guid, slot, line[3] )
                return;

            case 'P_D':
                eventhandler.player.emit( 'defuse', guid, slot, line[3] )
                return;

            case 'Weapon':
                eventhandler.player.emit( 'weaponpick', guid, slot, line[3], line[4] )
                return;
        }
    }
}

async function processChat( line )
{
    // need to append chat line in case it contains ";"
    if( line.length > 5 )
    line[4] = line.slice(4).join(';')

    const eventhandler = require('./eventhandler')
    // emit event. line[0] could only be either 'say' or 'sayteam' so its safe to do this
    eventhandler.player.emit( line[0], line[1], line[2], line[3], line[4] )

    // and an event which includes both say and sayteam for shit like commands
    eventhandler.player.emit( 'say/sayteam', line[1], line[2], line[3], line[4] )
}

async function processServerLines(line)
{
    const eventhandler = require('./eventhandler')
    if(line.startsWith('InitGame'))
    {
        eventhandler.server.emit( 'roundstart' )
        eventhandler.server.emit( 'initgame', line )
    }
    else if( line.startsWith('ExitLevel') )
        eventhandler.server.emit( 'endmap' )
}