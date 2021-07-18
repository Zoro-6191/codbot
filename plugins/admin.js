// commands: iamgod, b3/codbot, register, mask, unmask, clear(kiss), map, gametype, mag, maprotate, help, regulars, admins, rebuild?(sync), regtest, admintest, leveltest,
// makereg, unreg, putgroup, ungroup, say, time, seen, lookup, scream, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, aliases, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban, poke

const db = require('./db')
const { player } = require('./evenhandler')
const { updateClientInfo, client } = require('../client.js')

module.exports.init = async function()
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

module.exports.cmd_aliases()
{
    
}

module.exports.cmd_iamgod = async function()
{
    console.log('I am inevitable')
}