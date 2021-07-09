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
    // 0.00 -----------------------             // on round start
    // 0.00 InitGame: \fs_game\mods/...              // big ass line, but contains good amounta info
    // 0.00 J;<guid>;<slot>;<name>                   // player connect
    // 0.00 Q;<guid>;<slot>;<name>                   // player disconnect
    // 0.00 D;<guid>;<slot>;<team>;<name>;<att_guid>;<att_slot>;<att_team>;<att_name>;<weap>;<dmg>;<meansofdeath>;<hitloc>   // attacker inflicting dmg to our boy
    // 0.00 K;<guid>;<slot>;<team>;<name>;<att_guid>;<att_slot>;<att_team>;<att_name>;<weap>;<dmg>;<meansofdeath>;<hitloc>   // attacker killed our boy
    // 0.00 P_P;<guid>;<slot>;<name>                 // player plant
    // 0.00 P_D;<guid>;<slot>;<name>                 // player defuse
    // 0.00 say;<guid>;<slot>;<name>;<text>         // saytext wihtout quotes
    // 0.00 sayteam;<guid>;<slot>;<name>;<text>    // say team text wihtout quotes
    // 0.00 Weapon;<guid>;<slot>;<name>;<weapon>    // most probably pickup log. could be drop log too.
    // 0.00 ExitLevel: executed                      // no idea yet, probably no need to process it

    line = line.trim().split(" ").slice(1).join(" ")    // remove timestamp coz no need

    console.log(line)
}