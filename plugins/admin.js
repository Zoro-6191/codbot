// commands: clear(kiss), maprotate, regulars, rebuild?(sync), regtest,
// makereg, unreg, ungroup, seen, lookup, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban
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
const { isValidMap, getMap } = require('utils/maps')
const { isValidGametype, getGametype } = require('utils/gametypes')

const { getClientFromAgrs, getClientObj, getClientInfo, isClientInServer } = clientModule

// vars for local use
var mainconfig, pluginConf

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

module.exports = 
{
    init: async function()
    {
        pluginConf = conf.plugin.admin
        mainconfig = conf.mainconfig



        // player.on( 'connect', onConnect( guid, slot, ign) )
        // player.on( 'disconnect', onDisconnect( guid, slot, ign) )
    },

    // admins: get a list of online admins
    cmd_admins: async function( slot, mode, cmdargs )
    {
        // get config least admin level
        var least = pluginConf.settings.admins_level
        var client = clientModule.client
        var adminCount = 0
        var adminStr = ""

        for( var i = 0; i < client.length; i++ )
        {
            var cl = client[i]

            if( !cl.mask_level && cl.group_level >= least )
            {
                // create count
                adminCount++

                // create string to be sent
                if( adminStr != "" )
                    adminStr += ", "

                adminStr += `${cl.name}^7 [^3${cl.group_level}^7]`
            }
        }
        if( !adminCount )
            return sendMsg( mode, slot, pluginConf.messages.noadmin )

        return sendMsg( mode, slot, pluginConf.messages.cmd_admins.replace( '%admins%', adminStr ) )
    },

    // admintest: test whether you/player is admin or not ig
    cmd_admintest: async function( slot, mode, cmdargs )
    {
        var level, groupname
        var tz = mainconfig.codbot.timezone
        var clientObj

        // if not args, display cmders level
        if( !cmdargs.length )
            clientObj = await getClientObj( slot )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        if( parseInt(clientObj.mask_level) )
        {
            level = clientObj.group_bits==undefined?clientObj.mask_level:(await groupOperations.BitsToLevel( clientObj.mask_level ))
            groupname = await groupOperations.LevelToName( level )
        }
        else
        {
            level = clientObj.group_bits==undefined?clientObj.group_level:(await groupOperations.BitsToLevel( clientObj.group_bits ))
            groupname = await groupOperations.LevelToName( level )
        }

        var msg = pluginConf.messages.cmd_leveltest
            .replace(`%player%`, clientObj.name)
            .replace(`%id%`, clientObj.id)
            .replace(`%groupname%`, groupname)
            .replace(`%level%`, level)
            .replace(`%since%`, new Date(clientObj.time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: tz } ))
        
        return sendMsg( mode, slot, msg )
    },

    // aliases: command to check player's aliases used in the server
    cmd_aliases: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        // return console.log(clientObj);

        if( clientObj.mask_level )
            return sendMsg( mode, slot, pluginConf.messages.cmd_noaliases.replace('%player%', clientObj.name) )

        // now fetch aliases from aliases table
        const res = await db.pool.query( `SELECT * FROM aliases WHERE client_id=${clientObj.id}` )
            .catch( err =>
                {
                    sendMsg( mode, slot, pluginConf.messages.cmd_err_processing_cmd )
                    ErrorHandler.minor(err)
                })

        if( res == undefined )
            return

        if( !res.length )
            return sendMsg( mode, slot, pluginConf.messages.cmd_noaliases.replace('%player%', clientObj.name) )

        var aliasStr = ''

        for( var i = 0; i < res.length; i++ )
            aliasStr += res[i].alias + ', '
        
        return sendMsg( mode, slot, pluginConf.cmd_aliases.replace('%player%', clientObj.name).replace('%aliases%', aliasStr) )
    },

    // codbot: equivalent command to !b3.
    cmd_codbot: async function( slot, mode, cmdargs )
    {
        var uptime = Math.floor(process.uptime()*1000)

        // convert ms to readable time
        uptime = msToTime(uptime)

        if( !cmdargs.length )
        {
            sendMsg( mode, slot, '^1[^3CODBOT^1]')
            // sendMsg( mode, slot, `^7Uptime: ^7${uptime}`)
            return
        }
        token = cmdargs[0].toLowerCase()

        var name = getClientInfo( slot, 'name' )

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

    // gametype: change gametype
    cmd_gametype: async function( slot, mode, cmdargs )
    {
        var name = await clientModule.getClientInfo( slot, 'name' )
        
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        // check if mentioned map is valid
        var token = cmdargs[0].toLowerCase()

        if( !await isValidGametype( token ) )
            return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknowngametype.replace('%gametype%',token) )

        const gametype = await getGametype(token)

        if( pluginConf.settings.notify_issuer )
            sendMsg( 'g', slot, `^5${name} ^7changed the ^3Gametype ^7to ^3${gametype.name}` )

        sendMsg( 'g', slot, `Changing in ^23..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^22..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^21..`)
        await wait(1000)
        
        await rcon.rcontool.gametype(gametype.token)
    },

    // help: self explainatory
    cmd_help: async function( slot, mode, cmdargs )
    {
        const { command } = require('conf')

        if( !cmdargs.length )
        {
            // display all available cmds of that level
            var str = ``
            var level = await getClientInfo( slot, 'group_level' )

            for( var i = 0; i < command.length; i++ )
                if( command[i].minpower <= level )
                    str += `${command[i].name}, `

            str = str.substring( 0, str.length - 2 )    // remove last ", "

            return sendMsg( mode, slot, pluginConf.messages.cmd_help_available.replace('%cmd%',str))
        }
        else
        {
            var cmd = cmdargs[0].toLowerCase()
            var checkname = command.find( zz => zz.name == cmd )
            var checkalias = command.find( zz => zz.alias == cmd )

            var commandObj = checkname?checkname:checkalias

            if( checkname == undefined && checkalias == undefined )
                return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknown_cmd.replace('%cmd%',cmd) )

            sendMsg( mode, slot, `^2Command: ^7${commandObj.name}` )
            await wait(250)
            sendMsg( mode, slot, `^2About: ^7${commandObj.help}` )
            await wait(250)
            if( commandObj.alias )
            {
                sendMsg( mode, slot, `^2Alias: ^7${commandObj.alias}` )
                await wait(250)
            }
            sendMsg( mode, slot, `^2Usage: ^7${commandObj.usage}`.replace('%prefix%',conf.mainconfig.cmd.prefix) )
        }
    },

    // iamgod: command used to make any player superadmin if they enter correct password
    cmd_iamgod: async function( slot, mode, cmdargs )
    {
        const { highestLevel } = require('utils/groups')

        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        const iamgodpass = conf.mainconfig.codbot["iamgod_pass"]

        if( cmdargs[0] != iamgodpass )
            return sendMsg( 'p', slot, "Incorrect Password" )
        
        // now to get client and updating group in db and clientobj
        clientObj = await getClientObj( slot )

        if( clientObj.group_level == highestLevel )
            return sendMsg( 'p', slot, `You're already ${ await groupOperations.LevelToName( highestLevel )}` )

        clientObj.group_level = highestLevel

        highestBits = await groupOperations.LevelToBits( highestLevel )

        // update in database
        const q = await db.pool.query( `UPDATE clients SET group_bits=${highestBits},time_edit=UNIX_TIMESTAMP() 
        WHERE id=${clientObj.id}`)
            .catch( err=>
            {
                console.log(err)
                ErrorHandler.warning(`Couldn't save updated group level of player ${clientObj.name} @${clientObj.id} to database`)
            })

        if( q != undefined )
            return sendMsg( 'p', slot, `You're now ${groupOperations.LevelToName( highestLevel ) }` )
    },

    // leveltest: admin level of player and since when
    cmd_leveltest: async function( slot, mode, cmdargs )
    {
        var level, groupname, timeadd
        var tz = mainconfig.codbot.timezone
        var clientObj

        // if not args, display cmders level
        if( !cmdargs.length )
            clientObj = await getClientObj( slot )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        if( parseInt(clientObj.mask_level) )
        {
            level = clientObj.group_bits==undefined?clientObj.mask_level:(await groupOperations.BitsToLevel( clientObj.mask_level ))
            groupname = await groupOperations.LevelToName( level )
        }
        else
        {
            level = clientObj.group_bits==undefined?clientObj.group_level:(await groupOperations.BitsToLevel( clientObj.group_bits ))
            groupname = await groupOperations.LevelToName( level )
        }

        var msg = pluginConf.messages.cmd_leveltest
            .replace(`%player%`, clientObj.name)
            .replace(`%id%`, clientObj.id)
            .replace(`%groupname%`, groupname)
            .replace(`%level%`, level)
            .replace(`%since%`, new Date(clientObj.time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: tz } ))
        
        return sendMsg( mode, slot, msg )
    },

    // list: display list
    cmd_list: async function( slot, mode, cmdargs )
    {
        var client = clientModule.client
        var str = ``

        for( var i = 0; i < client.length; i++ )
        {
            var player = client[i]
            str += `${player.name} ^7[^2${player.slot}^7]`

            if( i < client.length - 1 )
                str += ', '
        }
        sendMsg( mode, slot, str )
    },

    // longlist: display list
    cmd_longlist: async function( slot, mode, cmdargs )
    {
        var client = clientModule.client

        for( var i = 0; i < client.length; i++ )
        {
            var player = client[i]
            sendMsg( mode, slot, `^7[^2${player.slot}^7] ^3${player.name} ^2@${player.id}` )
            
            await wait(500)
        }
    },

    // mag: change map and gametype together
    cmd_mag: async function( slot, mode, cmdargs )
    {
        if( cmdargs.length < 2 )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        var name = await clientModule.getClientInfo( slot, 'name' )

        // check if mentioned map is valid
        var maptok = cmdargs[0].toLowerCase()

        if( !await isValidMap( maptok ) )
            return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknownmap.replace('%map%',maptok) )

        var gttok = cmdargs[1].toLowerCase()

        if( !await isValidGametype( gttok ) )
            return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknowngt.replace('%gametype%',gttok) )

        const map = await getMap(maptok)
        const gametype = await getGametype(gttok)

        // if enabled, notify everyone who issued the command

        rcon.rcontool.execRconCmd(`g_gametype ${gametype.token}`)
            .then( ()=> sendMsg( 'g', slot, `Gametype set to ^3${gametype.name}`) )

        if( pluginConf.settings.notify_issuer )
            sendMsg( 'g', slot, `^5${name} ^7changed the  map to ${map.name}` )

        sendMsg( 'g', slot, `Changing in ^23..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^22..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^21..`)
        await wait(1000)
        
        await rcon.rcontool.map(map.token)
    },

    // map: change map
    cmd_map: async function( slot, mode, cmdargs )
    {
        var name = await clientModule.getClientInfo( slot, 'name' )
        
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        // check if mentioned map is valid
        var token = cmdargs[0].toLowerCase()

        if( !await isValidMap( token ) )
            return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknownmap.replace('%map%',token) )

        const map = await getMap(token)

        // if enabled, notify everyone who issued the command

        if( pluginConf.settings.notify_issuer )
            sendMsg( 'g', slot, `^5${name} ^7changed the  map to ${map.name}` )

        sendMsg( 'g', slot, `Changing in ^23..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^22..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^21..`)
        await wait(1000)
        
        await rcon.rcontool.map(map.token)
    },

    // maprotate: rotate map
    cmd_maprotate: async function( slot, mode )
    {
        var name = await clientModule.getClientInfo( slot, 'name' )

        // check if mentioned map is valid
        var token = cmdargs[0].toLowerCase()

        if( !await isValidMap( token ) )
            return sendMsg( mode, slot, pluginConf.messages.cmd_err_unknownmap.replace('%map%',token) )

        const map = await getMap(token)

        // if enabled, notify everyone who issued the command

        if( pluginConf.settings.notify_issuer )
            sendMsg( 'g', slot, `^5${name} ^7changed the  map to ${map.name}` )

        sendMsg( 'g', slot, `Changing in ^23..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^22..`)
        await wait(1000)
        sendMsg( 'g', slot, `Changing in ^21..`)
        await wait(1000)
        
        await rcon.rcontool.map(map.token)
    },

    // maps: display list of all maps from "codbot/conf/maps.txt"
    cmd_maps: async function( slot, mode, cmdargs )
    {
        // get maps object
        // then display
        // ez
    },

    // mask: mask people's admin level and aliases
    cmd_mask: async function( slot, mode, cmdargs )
    {
        // check if args are correct
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )
        
        // first validate group token/level
        if( !(await groupOperations.isValidKeyword( cmdargs[0] )) )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_group_unknown.replace('%groupname%',cmdargs[0]) )

        // get player from second arg if exists, else use cmder
        if( cmdargs.length < 2 )
            clientObj = await getClientObj( slot )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[1] )
            .catch( () => {} )

        if( clientObj == undefined )
            return
            
        var maskName = await groupOperations.KeywordToName(cmdargs[0])
        var maskBits = await groupOperations.KeywordToBits(cmdargs[0])
        var maskLevel = await groupOperations.KeywordToLevel(cmdargs[0])

        if( clientObj.mask_level == maskLevel || clientObj.mask_level == maskBits )
        {
            if( clientObj.slot != undefined && clientObj.slot == slot )
                return sendMsg( mode, slot, `You're already masked as ^3${maskName}` )
            else return sendMsg( mode, slot, `^2${clientObj.name} ^7is already masked as ^3${maskName}` )
        }

        await db.pool.query( `UPDATE clients SET mask_level=${maskBits} WHERE id=${clientObj.id}` )
            .catch( err => 
                {
                    sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )
                    ErrorHandler.minor(err)
                })
            .then( () =>
                {
                    if( clientObj.slot != undefined )   // can be if used @id or player not in server
                        updateClientInfo( clientObj.slot, 'mask_level', maskLevel )
                    
                    if( clientObj.slot == slot )
                        sendMsg( mode, slot, `Masked as ^3${maskName}` )
                    else sendMsg( mode, slot, `^2${clientObj.name} masked as ^3${maskName}` )
                })
    },
    
    // poke: fun cmd
    cmd_poke: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        if( !(await isClientInServer( clientObj.id )) )
            return sendMsg( mode, slot, cmd_err_notinserver )
        else if( clientObj.slot != undefined && clientObj.slot == slot )
            return sendMsg( mode, slot, `Why tf are you poking yourself :D?` )

        let options = [ 'Wake up', '*poke*', 'Attention', 'Get up', 'Go', 'Move out' ]

        return sendMsg('g', slot, `${options[Math.floor(Math.random() * options.length)]} %player%!`.replace( '%player%', clientObj.name ) )
    },

    // putgroup: change user group
    cmd_putgroup: async function( slot, mode, cmdargs )
    {
        if( cmdargs.length < 2 )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        // now validate group token
        if( !(await groupOperations.isValidKeyword( cmdargs[1] )) )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_group_unknown.replace('%groupname%',cmdargs[1]) )

        var newGroupBits = await groupOperations.KeywordToBits( cmdargs[1] )
        var newGroupLevel = await groupOperations.KeywordToLevel( cmdargs[1] )
        var newGroupName = await groupOperations.KeywordToName( cmdargs[1] )

        // check if player already in that group
        if( await isClientInServer( clientObj.id ) )
        {
            if( clientObj.group_level == newGroupLevel )
                return sendMsg( mode, slot, pluginConf.messages.groups_already_in.replace('%player%',clientObj.name).replace('%groupname%',newGroupName) )
        }
        else
        {
            if( (await groupOperations.BitsToLevel(clientObj.group_bits)) == newGroupLevel )
            {
                if( clientObj.slot == slot )
                    return sendMsg( mode, slot, `You're already in group ^3${newGroupName}` )
                else return sendMsg( mode, slot, pluginConf.messages.groups_already_in.replace('%player%',clientObj.name).replace('%groupname%',newGroupName) )
            }
        }

        // begin magic
        await db.pool.query(`UPDATE clients SET group_bits=${newGroupBits} WHERE id=${clientObj.id}`)
            .catch( err =>
                {
                    sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )
                    ErrorHandler.warning(err)
                })
            .then( async()=>
                {
                    if( await isClientInServer( clientObj.id ) )
                        updateClientInfo( clientObj.slot, 'group_level', newGroupLevel )
                    sendMsg( mode, slot, pluginConf.messages.groups_put.replace('%player%',clientObj.name).replace('%groupname%',newGroupName))
                })
    },

    // register: promote guests to user, and enable their xlrstats
    cmd_register: async function( slot, mode )
    {
        // return if player already higher group
        const { lowestLevel } = require('utils/groups')

        var clientObj = await clientModule.getClientObj( slot )
        
        // no players exist?
        if( clientObj == undefined )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )

        if( clientObj.group_level > lowestLevel )
            sendMsg( mode, slot, `You have already registered` )

        // this way they get to keep the stats they earned this session, another improvement on b3
        // IGNORE = ignore errors, thus only creating row if it doesnt already exist based on client_id
        await db.pool.query(`
            INSERT IGNORE INTO xlr_playerstats
                (
                    client_id,
                    kills,
                    deaths,
                    teamkills,
                    teamdeaths,
                    suicides,
                    ratio,
                    skill,
                    rounds
                )
            VALUES
                (
                    ${clientObj.id}, 
                    ${clientObj.kills}, 
                    ${clientObj.deaths},
                    ${clientObj.tk}, 
                    ${clientObj.teamdeaths}, 
                    ${clientObj.suicides},
                    ${clientObj.kills/(clientObj.deaths==0?1:clientObj.deaths)},
                    ${clientObj.skill}, 
                    ${clientObj.roundsplayed}
                )`)
        .catch( ErrorHandler.fatal )
        .then( () => 
            {
                db.pool.query(`UPDATE clients SET group_bits=1 WHERE id=${clientObj.id}`) 
            })
        .catch( err =>
            {
                sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )
                ErrorHandler.warning(err)
            })
        .then( ()=> 
            {
                var confirmMsg = pluginConf.messages.regme_confirmation
                    .replace('%player%', clientObj.name)
                    .replace('%groupname%', groupOperations.BitsToName(1))

                clientObj.registered = 1
                clientObj.group_level = 1

                sendMsg( mode, slot, confirmMsg )
                if( pluginConf.settings.announce_registration )
                {
                    var announceMsg = pluginConf.messages.regme_announce
                        .replace('%player%', clientObj.name)
                        .replace('%groupname%', groupOperations.BitsToName(1))

                    return sendMsg( 'g', slot, announceMsg )
                }
            }
        )
    },

    cmd_say: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        sendMsg( 'g', slot, `${await getClientInfo( slot, 'name' )}: ${cmdargs.join(' ')}` )
    },

    cmd_scream: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        for( var i = 1; i < 6; i++ )
        {
            rcon.rcontool.say(`^6${await getClientInfo(slot,'name')}: ^${i}${cmdargs.join(' ')}`)
            if( i != 5 )
                await wait( 500 )
        }
    },

    cmd_time: async function( slot, mode )
    {
        var time = new Date().toLocaleTimeString("en-US", { timeStyle: 'full', timeZone: mainconfig.codbot.timezone } )
        sendMsg( mode, slot, pluginConf.messages.cmd_time.replace('%time%',time) )
    },

    // unmask
    cmd_unmask: async function( slot, mode, cmdargs )
    {
        // unless arg exists unmask yourself
        if( !cmdargs.length )
            clientObj = await clientModule.getClientObj( slot )
        else clientObj = await getClientFromAgrs( slot, mode, cmdargs[0] )
            .catch( () => {} )

        if( clientObj == undefined )
            return

        // check if they're already unmasked
        if( !clientObj.mask_level )
        {
            if( clientObj.slot != undefined && clientObj.slot == slot )    // cmder
                msg1 = `You're already unmasked.`
            else msg1 = `^1${clientObj.name} ^7is already unmasked.`
            return sendMsg( mode, slot, msg1 )
        }
        
        // unmask them and update it in db
        await db.pool.query( `UPDATE clients SET mask_level=0 WHERE id=${clientObj.id}` )
            .catch( err =>
                {
                    sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )
                    ErrorHandler.minor(err)
                })
            .then( ()=>
            {
                if( isClientInServer(clientObj.id) )
                {
                    updateClientInfo( clientObj.slot, 'mask_level', 0 )
                    if( clientObj.slot != slot )
                        sendMsg( 'p', clientObj.slot, `Unmasked` )
                }
                if( clientObj.slot == slot )
                    sendMsg( mode, slot, `Unmasked` )
                else sendMsg( mode, slot, `Unmasked ^2${clientObj.name}` )
            } )
    }
}