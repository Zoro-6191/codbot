// commands: iamgod, b3/codbot, register, mask, unmask, clear(kiss), map, gametype, mag, maprotate, help, regulars, admins, rebuild?(sync), regtest, admintest, leveltest,
// makereg, unreg, putgroup, ungroup, say, time, seen, lookup, scream, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, aliases, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban, poke

const db = require('./db')
const { player } = require('./evenhandler')
const { updateClientInfo, client } = require('../client.js')

module.exports = 
{
    name: 'Admin',
    description: 'Basic commands and functionalities',
    init
}

async function init()
{
    // initEvents()
}

async function initEvents()
{
    player.on( 'connect', ( guid, slot, ign )=>{

    })
}