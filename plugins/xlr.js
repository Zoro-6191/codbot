require('rootpath')()
const { updateClientInfo } = require("utils/client")
const { DebugMode } = require('conf')
const db = require('utils/db')
const { sendMsg } = require('utils/msnger')
const conf = require('conf')
const { groupOperations } = require('utils/groups')
const rcon = require('utils/rcon')
const clientModule = require('utils/client')
const ErrorHandler = require('src/errorhandler')
const eventhandler = require('src/eventhandler')
const { wait, msToTime } = require('utils/utility')

const { getClientFromAgrs, getClientObj, isSlotFilled, getPlayerByNameToken, getClientInfo, isClientInServer } = clientModule

// vars for local use
var mainconfig, pluginConf

module.exports = 
{
    init: async function()
    {
        pluginConf = conf.plugin.xlr
        mainconfig = conf.mainconfig

        const { player, server } = eventhandler

        player.on( 'firstconnect', onFirstConnect )
        player.on( 'connect', onConnect )
        player.on( 'damage', onDamage )
        player.on( 'kill', onKill )
        player.on( 'plant', onPlant )
        player.on( 'defuse', onDefuse )
        player.on( 'weaponpick', onWeaponPick )
        player.on( 'disconnect', onDisconnect )

        server.on( 'roundstart', onRoundStart )
        server.on( 'endmap', onEndMap )
    },

    cmd_xlrstats: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            clientObj = await getClientObj(slot)
        else clientObj = await getClientFromAgrs(cmdargs[0])
            .catch(()=>{})
        
        if( clientObj == undefined )
            return

        if( clientObj.registered != undefined && !clientObj.registered )
        {
            if( clientObj.slot != undefined && clientObj.slot == slot )
                return sendMsg( mode, slot, pluginConf.messages.cmd_err_self_notreg )
            else return sendMsg( mode, slot, pluginConf.messages.cmd_err_plr_notreg.replace('%name%',clientObj.name) )
        }

        if( isClientInServer(clientObj.id) )
        {
            if( clientObj.slot != slot && clientObj.xlrhide )
                return sendMsg( mode, slot, pluginConf.messages.cmd_err_statshidden.replace('%name%',clientObj.name) )

            var str = pluginConf.messages.cmd_xlrstats
                .replace('%name%', clientObj.name )
                .replace('%kills%', clientObj.kills )
                .replace('%deaths%', clientObj.deaths )
                .replace('%tk%', clientObj.tk )
                .replace('%ratio%', clientObj.ratio )
                .replace('%skill%', clientObj.skill )
        }
        else
        {
            const result = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${clientObj.id}`)
                .catch( err =>
                {
                    sendMsg( mode, slot, pluginConf.messages.cmd_err_processing_cmd )
                    ErrorHandler.minor(err)
                })
            
            if( result == undefined )
                return

            if( !result.length )
                return sendMsg( mode, slot, pluginConf.messages.cmd_err_plr_notreg.replace('%name%',clientObj.name) )

            if( result[0].hide )
                return sendMsg( mode, slot, pluginConf.messages.cmd_err_statshidden.replace('%name%',clientObj.name) )

            var str = pluginConf.messages.cmd_xlrstats
                .replace('%name%', clientObj.name )
                .replace('%kills%', result[0].kills )
                .replace('%deaths%', result[0].deaths )
                .replace('%tk%', result[0].teamkills )
                .replace('%ratio%', result[0].ratio )
                .replace('%skill%', result[0].skill )
        }
        sendMsg( mode, slot, str )
    },

    cmd_xlrhide: async function( slot, mode, cmdargs )
    {

    },

    cmd_xlrtopstats: async function( slot, mode, cmdargs )
    {
        
    }
}

async function onRoundStart()
{
    // increment all registered player's round count
}

async function onEndMap()
{

}

async function onFirstConnect( guid, slot, ign )
{

}

async function onConnect( guid, slot, ign )
{
    
}

async function onDamage( guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc )
{
    
}

async function onKill( guid, slot, team, name, att_guid, att_slot, att_team, att_name, weap, dmg, MeansOfDeath, hitloc )
{
    // update on xlr_playerstats
    // process assists
}

async function onPlant( guid, slot, ign )
{
    
}

async function onDefuse( guid, slot, ign )
{
    
}

async function onDefuse( guid, slot, ign )
{
    
}

async function onWeaponPick( guid, slot, ign, weap )
{
    
}

async function onDisconnect( guid, slot, ign )
{
    
}