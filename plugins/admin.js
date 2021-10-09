// commands: register, mask, unmask, clear(kiss), map, gametype, mag, maprotate, help, regulars, admins, rebuild?(sync), regtest, admintest, leveltest,
// makereg, unreg, putgroup, ungroup, say, time, seen, lookup, scream, find, clientinfo, kick, kickall, spank, spankall, permban, ban, banall, lastbans, baninfo, unban,
// runas, aliases, warns, notice, warn, warntest, warnremove, warnclear, warninfo, maps, nextmap, spam, rules, spams, tempban, poke

const { DebugMode } = require.main.require('./conf')
const db = require.main.require('./utils/db')
const { sendMsg, replacePlaceholder } = require.main.require('./utils/msnger')
const conf = require.main.require('./conf')
const { groupOperations } = require.main.require('./utils/groups')
const rcon = require.main.require('./utils/rcon')
const clientModule = require.main.require('./utils/client')
const ErrorHandler = require.main.require('./src/errorhandler')
const eventhandler = require.main.require('./src/eventhandler')
const { msToTime } = require.main.require('./utils/utility')

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

        // now to get list of all online admins
        Object.keys(client).forEach( cl => {
            if( cl.group_level >= least )
            {
                // create count
                adminCount++

                // create string to be sent
                if( adminStr != "" )
                    adminStr += ", "

                adminStr += `${cl.name}^7 [^3${cl.group_level}^7]`
            }
        })

        if( !adminCount )
            return sendMsg( mode, slot, pluginConf.messages.noadmin )

        var sendStr = pluginConf.messages.cmd_admins.replace( '%admins%', adminStr )

        return sendMsg( mode, slot, sendStr )
    },

    // aliases: command to check player's aliases used in the server
    cmd_aliases: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        if( !Number.isInteger( cmdargs[0] ) && parseInt(cmdargs[0]) <= 64 )
            clientObj = await clientModule.getClientObj( cmdargs[0] )

        if( clientObj == undefined )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        if( clientObj.mask_level )
            return sendMsg( mode, slot, pluginConf.messages.cmd_noaliases.replace('%player%', clientObj.name) )

        // now fetch aliases from aliases table
        const res = await db.pool.query( `SELECT * FROM aliases WHERE client_id=${clientObj.id}` )
            .catch( sendMsg( mode, slot, pluginConf.messages.cmd_err_processing_cmd ) )

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
            sendMsg( mode, slot, '^1[^3CODBOT^1] ^7by ^2Zoro')
            sendMsg( mode, slot, `^7Uptime: ^7${uptime}`)
            return
        }
        token = cmdargs[0].toLowerCase()

        var name = clientModule.getClientInfo( slot, 'name' )

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
        const { highestLevel } = require.main.require('./utils/groups')

        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        const iamgodpass = conf.mainconfig.codbot["iamgod_pass"]

        if( cmdargs[0] != iamgodpass )
            return sendMsg( 'p', slot, "Incorrect Password" )
        
        // now to get client and updating group in db and clientobj
        clientObj = await clientModule.getClientObj( slot )

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
        var name, id, level, groupname, timeadd
        var msg = pluginConf.messages.cmd_leveltest
        var tz = mainconfig.codbot.timezone

        // if not args, display cmders level
        if( cmdargs.length )
        {
            var arg = cmdargs[0]
            // get player from args and validate it
            if( !Number.isInteger( arg ) && arg <= 64 )
                clientObj = await clientModule.getClientObj( arg )

            if( clientObj == undefined )
                return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )
        }
        else clientObj = await clientModule.getClientObj( slot )

        name = clientObj.name
        id = clientObj.id
        level = clientObj.group_level
        groupname = groupOperations.LevelToName( level )
        timeadd = clientObj.time_add

        // now to format unix timestamp properly
        timeadd = new Date(timeadd * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: tz } );

        msg = await replacePlaceholder( msg, `%player%`, name )
        msg = await replacePlaceholder( msg, `%id%`, id )
        msg = await replacePlaceholder( msg, `%groupname%`, groupname )
        msg = await replacePlaceholder( msg, `%level%`, level )
        msg = await replacePlaceholder( msg, `%since%`, timeadd )
        
        return sendMsg( mode, slot, msg )
    },

    // mag: change map and gametype together
    cmd_mag: async function( slot, mode, cmdargs )
    {
        if( cmdargs.length < 2 )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        var mentionedMap = cmdargs[0]


        var mentionedGT = cmdargs[1]



        
    },

    // map: change map
    cmd_map: async function( slot, mode, cmdargs )
    {
        var name = await clientModule.getClientInfo( slot, 'name' )
        
        // check if map exists in maplist
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

        // check if mentioned map is valid


        // if enabled, notify everyone who issued the command
        if( pluginConf.settings.notify_issuer )
            sendMsg( 'g', slot, `^5${name} changed the  map to ${mapName}` )
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

        // get player from second arg if exists
        
    },
    
    // poke: fun cmd
    cmd_poke: async function( slot, mode, cmdargs )
    {
        if( !cmdargs.length )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )
        else
        {
            // here check for cmdargs, validate them and get player from them
            if( Number.isInteger(cmdargs[0]) )
            {
                if( cmdargs[0] < 0 || cmdargs[0] > 64 )
                    return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

                if( !isSlotFilled(cmdargs[0]) )
                    return sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )

                var playername = await clientModule.getClientInfo( cmdargs[0], 'name' )
            }
            else
            {
                var resultsFound = await clientModule.getPlayerByNameToken( cmdargs[0] )

                if( !resultsFound.length )
                    return sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )

                if( resultsFound.length > 1 )
                {
                    var str = ``

                    for( var i = 0; i < resultsFound.length; i++ )
                    {
                        str += `${await clientModule.getClientInfo( resultsFound[i], 'name' )}^3[^7${resultsFound[i]}^3]`

                        if( i != resultsFound.length-1 )
                            str += `^7, `
                    }
                    return sendMsg( mode, slot, pluginConf.messages.players_matched.replace('%arg%',cmdargs[0]).replace('%players%',str) )
                }
                else var playername = await clientModule.getClientInfo( resultsFound[0], 'name' )
            }
        }

        if( playername == undefined )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )

        let options = [ 'Wake up', '*poke*', 'Attention', 'Get up', 'Go', 'Move out' ]

        return sendMsg('g', slot, `${options[Math.floor(Math.random() * options.length)]} %player%!`.replace( '%player%', playername ) )
    },

    // register: promote guests to user, and enable their xlrstats
    cmd_register: async function( slot, mode )
    {
        // return if player already higher group
        const { lowestLevel } = require.main.require('./utils/groups')

        var clientObj = await clientModule.getClientObj( slot )
        
        // no players exist?
        if( clientObj == undefined )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )

        if( clientObj.group_level > lowestLevel )
            sendMsg( mode, slot, `You are already in a higher group level` )

        // this way they get to keep the stats they earned this session, another improvement on b3
        // IGNORE = ignore errors, thus only creating row if it doesnt already exist based on client_id
        await db.pool.query(`
            INSERT IGNORE INTO xlr_playerstats 
            SET 
                client_id=${clientObj.id}, 
                kills=${clientObj.kills}, 
                deaths=${clientObj.deaths}
                teamkills=${clientObj.tk}, 
                teamdeaths=${clientObj.teamdeaths}, 
                suicides=${clientObj.suicides},
                ratio=${clientObj.ratio}, 
                skill=${clientObj.skill}, 
                rounds=${clientObj.roundsplayed}`)
        .catch( err=> ErrorHandler.minor(err) )
        .then( db.pool.query(`UPDATE clients SET group_bits=1 WHERE id=${clientObj.id}`) )
        .catch( err =>
            {
                sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )
                ErrorHandler.warning(err)
            })
        .then( ()=> 
            {
                var confirmMsg = pluginConf.messages.regme_confirmation
                confirmMsg = replacePlaceholder( confirmMsg, '%player%', clientObj.name )
                console.log(confirmMsg)
                confirmMsg = replacePlaceholder( confirmMsg, '%groupname%', groupOperations.BitsToName(1) )

                clientObj.group_level = 1

                sendMsg( mode, slot, confirmMsg )
                if( pluginConf.settings.announce_registration )
                {
                    var announceMsg = pluginConf.messages.regme_announce
                    announceMsg = replacePlaceholder( announceMsg, '%player%', clientObj.name )
                    announceMsg = replacePlaceholder( announceMsg, '%groupname%', groupOperations.BitsToName(1) )

                    return sendMsg( 'g', slot, announceMsg )
                }
            }
        )
    },

    // unmask
    cmd_unmask: async function( slot, mode, cmdargs )
    {
        // unless arg exists unmask yourself
        if( !cmdargs.length )
            var clientObj = await clientModule.getClientObj( slot )
        else
        {
            // here check for cmdargs, validate them and get player from them
            if( Number.isInteger(cmdargs[0]) )
            {
                if( cmdargs[0] < 0 || cmdargs[0] > 64 )
                    return sendMsg( 'p', slot, pluginConf.messages.cmd_err_invalidparams )

                if( !isSlotFilled(cmdargs[0]) )
                    return sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )
                    
                var clientObj = await clientModule.getClientObj( cmdargs[0] )
            }
            else
            {
                var resultsFound = await clientModule.getPlayerByNameToken( cmdargs[0] )

                if( !resultsFound.length )
                    return sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )

                if( resultsFound.length > 1 )
                {
                    var str = ``

                    for( var i = 0; i < resultsFound.length; i++ )
                    {
                        str += `${await clientModule.getClientInfo( resultsFound[i], 'name' )}^3[^7${resultsFound[i]}^3]`

                        if( i != resultsFound.length-1 )
                            str += `^7, `
                    }
                    return sendMsg( mode, slot, pluginConf.messages.players_matched.replace('%arg%',cmdargs[0]).replace('%players%',str) )
                }
                else var clientObj = await clientModule.getClientObj( resultsFound[0] )
            }
        }

        if( clientObj == undefined )
            return sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd ) 

        // check if they're already unmasked
        if( !clientObj.mask_level )
        {
            if( !cmdargs.length )    // cmder
                var msg1 = `You're already unmasked.`
            else var msg1 = `^1${clientObj.name} ^7is already unmasked.`
            return sendMsg( mode, slot, msg1 )
        }
        
        // unmask them and update it in db
        await db.pool.query( `UPDATE clients SET mask_level=0 WHERE id=${clientObj.id}` )
            .catch( sendMsg( 'p', slot, pluginConf.messages.cmd_err_processing_cmd )  )
            .then( ()=>
            {
                clientObj.mask_level = 0;
                return sendMsg( mode, slot, `Unmasked ^2${cmdargs.length?clientObj.name='^7 ':''}` )
            } )
    }
}