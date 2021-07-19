// commands: iamgod, b3/codbot, register, mask, unmask, clear(kiss), map, gametype, mag, maprotate, help, regulars, admins, rebuild?(sync), regtest, admintest, leveltest,
// makereg, unreg, putgroup, ungroup, say, time, seen, lookup, scream, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, aliases, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban, poke

const db = require('../db')
const { sendMsg } = require('../msnger')
const conf = require('../conf')
const rcon = require('../rcon')
const ErrorHandler = require('../errorhandler')
const eventhandler = require('../eventhandler')

module.exports = 
{
    init,

    cmd_admins: async function( slot, mode, cmd, cmdargs )
    {

    },

    cmd_aliases: async function( slot, mode, cmd, cmdargs )
    {

    },

    cmd_iamgod: async function( slot, mode, cmd, cmdargs )
    {
        const iamgodpass = conf.mainconfig.codbot["iamgod_pass"]

        return sendMsg( mode, slot, "You sure are" )

        if( cmdargs[0] != iamgodpass )
        {
            
        }
    },
}

async function init()
{
    player.on( 'connect', onConnect( guid, slot, ign) )
    player.on( 'disconnect', onDisconnect( guid, slot, ign) )
}

async function onConnect( guid, slot, ign )
{
    // update IP in IP table and clients table
    // update current_clients table?
    // take old name from clients table and push it to aliases table, and update new name in clients table
    // increment connections column in clients table
}

async function onDisconnect( guid, slot, ign )
{
    // update lastedit/lastseen?
}