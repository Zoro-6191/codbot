// commands: register, mask, unmask, clear(kiss), map, gametype, mag, maprotate, help, regulars, admins, rebuild?(sync), regtest, admintest, leveltest,
// makereg, unreg, putgroup, ungroup, say, time, seen, lookup, scream, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, aliases, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban, poke

const db = require('../db')
const { sendMsg, replacePlaceholder } = require('../msnger')
const conf = require('../conf')
const { groupOperations } = require('../groups')
const rcon = require('../rcon')
const clientModule = require('../client')
const ErrorHandler = require('../errorhandler')
const eventhandler = require('../eventhandler')
const { msToTime } = require('../utility')

var mainconfig, pluginConf

module.exports = 
{
    init,

    // admins: get a list of online admins
    cmd_admins: async function( slot, mode, cmdargs )
    {

    },

    // aliases: command to check player's aliases used in the server
    cmd_aliases: async function( slot, mode, cmdargs )
    {
        // for now we'll just get aliases everytime from db
        // unless player is masked

        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams)
    },

    // codbot: equivalent command to !b3.
    cmd_codbot: async function( slot, mode, cmdargs )
    {
        var uptime = Math.floor(process.uptime()*1000)

        // convert ms to readable time
        uptime = msToTime(uptime)

        if( !cmdargs.length )
        {
            sendMsg( mode, slot, '^1[^3CODBOT^1] ^7by ^2Zoro')
            sendMsg( mode, slot, `^7Uptime: ^7${uptime}`)
            return
        }
        token = cmdargs[0].toLowerCase()

        var name = clientModule.client.find( zz => zz.slot == slot ).name

        switch(token)
        {
            case 'expose':
                return sendMsg( mode, slot, `^7Do expose codbot to sunlight.`)

            case 'feed':
                return sendMsg( mode, slot, `^7codbot appriciates good nourishment, ^2${name}`)

            case 'flog':
                return sendMsg( mode, slot, `^7So kinky`)

            case 'poke':
                return sendMsg( mode, slot, `^7Do not poke codbot`)

            case 'sexor':
                return sendMsg( mode, slot, `^7Mmmmm, ${name} 3=o`)

            case 'stare':
                return sendMsg( mode, slot, `^7Do not stare codbot, ${name}`)

            default:
                return sendMsg( mode, slot, `^7stfu`)
        }
    },

    // iamgod: command used to make any player superadmin if they enter correct password
    cmd_iamgod: async function( slot, mode, cmdargs )
    {
        const { highestLevel } = require('../groups')

        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        const iamgodpass = conf.mainconfig.codbot["iamgod_pass"]

        if( cmdargs[0] != iamgodpass )
            return sendMsg( 'p', slot, "Incorrect Password" )
        
        // now to get client and updating group in db and clientobj
        clientObj = clientModule.client.find( zz => zz.slot == slot )

        if( clientObj.group_level == highestLevel )
            return sendMsg( 'p', slot, `You're already ${ await groupOperations.LevelToName( highestLevel )}` )

        clientObj.group_level = highestLevel

        highestBits = await groupOperations.LevelToBits( highestLevel )

        // update in database
        db.pool.query( `UPDATE clients SET group_bits=${highestBits},time_edit=UNIX_TIMESTAMP() WHERE id=${parseInt(clientObj.id)}`, (err)=>{
            if( err )
            {
                console.log(err)
                ErrorHandler.warning(`Couldn't save updated group level of player ${clientObj.name} @${clientObj.id} to database`)
            }
            else return sendMsg( 'p', slot, `You're now ${groupOperations.LevelToName( highestLevel ) }` )
        })
    },

    // leveltest: admin level of player and since when
    cmd_leveltest: async function( slot, mode, cmdargs )
    {
        var name, id, level, groupname, timeadd
        var msg = pluginConf.messages.cmd_leveltest
        var tz = mainconfig.codbot.timezone
        // if not args, display cmders level
        if( cmdargs.length )
        {
            var arg = cmdargs[0]
            // get player from args and validate it
            if( !Number.isNaN( parseInt(arg) ) && parseInt(arg) <=64 )
                clientObj = clientModule.client.find( zz => zz.slot == arg )

            if( clientObj == undefined )
                return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

            console.log( clientObj )

            name = clientObj.name
            id = clientObj.id
            level = clientObj.group_level
            groupname = groupOperations.LevelToName( level )
            timeadd = clientObj.time_add
        }
        else
        {
            clientObj = clientModule.client.find( zz => zz.slot == slot )

            name = clientObj.name
            id = clientObj.id
            level = clientObj.group_level
            groupname = groupOperations.LevelToName( level )
            timeadd = clientObj.time_add
        }
        console.log( clientObj )

        // now to format unix timestamp properly
        timeadd = new Date(timeadd * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: tz } );

        msg = await replacePlaceholder( msg, `%player%`, name )
        msg = await replacePlaceholder( msg, `%id%`, id )
        msg = await replacePlaceholder( msg, `%groupname%`, groupname )
        msg = await replacePlaceholder( msg, `%level%`, level )
        msg = await replacePlaceholder( msg, `%since%`, timeadd )
        
        return sendMsg( mode, slot, msg )
    },

    // maps: display list of all maps from "codbot/conf/maps.txt"
    cmd_maps: async function( slot, mode, cmdargs )
    {
        // get maps object
        // then display
        // ez
    }
}

async function init()
{
    pluginConf = conf.plugin.admin
    mainconfig = conf.mainconfig

    // player.on( 'connect', onConnect( guid, slot, ign) )
    // player.on( 'disconnect', onDisconnect( guid, slot, ign) )
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