// this file stores and updates currently playing clients based on their slot
require('rootpath')()
const eventhandler = require('src/eventhandler')
const db = require('utils/db')
const ErrorHandler = require('src/errorhandler')
const { groupOperations } = require('utils/groups')
const conf = require('conf')
const { sendMsg } = require('utils/msnger')
require('colors')

// for local use
var client

module.exports = 
{
    init,
    isSlotFilled,
    getClientInfo,
    getClientObj,
    updateClientInfo,
    getPlayerByNameToken,
    getClientFromAgrs,
    isClientInServer
}

// TO-DO: aliascount, assists, deaths, ipaliascount, kills, ratio, roundsplayed, skill, suicides, teamdeaths, tk

// ======= client object:
// [
//  // each player has one of these
//     {
//         aliascount:
//         assists:
//         deaths:
//         id:
//         ip:
//         ipaliascount:
//         kills:
//         greeting:
//         group_level:
//         guid:
//         last_ip:
//         last_name:
//         losestreak:
//         name:
//         noc:
//         masked_level:
//         ping:
//         ratio:
//         registered:
//         roundsplayed:
//         score:
//         skill:
//         slot:
//         steamid:
//         suicides:
//         teamdeaths:
//         time_add:
//         time_edit:
//         tk:
//         winstreak:
//         xlrhide:
//     },
// ]

async function init()
{
    if( module.exports.client == undefined )
    {
        client = [] // for simplicity
        module.exports.client = client
    }

    // get current players and update to client object
    const { rcontool } = require('./rcon')
    const status = await rcontool.rconStatus()

    // if server offline, for now just crash
    if( !(await status.online) )
        return ErrorHandler.fatal(`COD4 Server not online`)
    else rcontool.say(`^1[^3CODBOT^1] ^2Started`)

    const onlinePlayers = await status.onlinePlayers
    if( onlinePlayers.length )
    {
        var guidStr = ``
        for( i=0; i < onlinePlayers.length; i++ )
        {
            var slot = onlinePlayers[i].num    // we need slot num which is always unordered in
            
            updateClientInfo( slot, "slot", slot )
            updateClientInfo( slot, "name", onlinePlayers[i].name )
            updateClientInfo( slot, "score", onlinePlayers[i].score )   // needed?
            updateClientInfo( slot, "ping", onlinePlayers[i].ping )
            updateClientInfo( slot, "guid", onlinePlayers[i].id )
            updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
            updateClientInfo( slot, "ip", onlinePlayers[i].ip )

            guidStr += onlinePlayers[i].id
                if( i < onlinePlayers.length-1 )
                    guidStr += ','
        }
        // TO-DO: update database stuff right here and now too
        // can be a bit heavy
        
        // can use IN keyword of mysql for single query then processing it over here
        // only problem is any client's first connection, he won't have his guid in the database
        // we'll need to process that too altogether right here and now
        // one way would be to compare lengths of onlinePlayers and query result
        const result = await db.pool.query(`SELECT * FROM clients WHERE guid IN(${guidStr})`)
            .catch( ErrorHandler.fatal )

        // only possible when new player in server and codbot just started 
        if( onlinePlayers.length != result.length )
        {
            // now to create entries for new player
            // first need to identify who's id is missing
            var newPlayers = []

            for( var i = 0; i < onlinePlayers.length; i++ )
            {
                if( doesGUIDExistInQuery( onlinePlayers[i].id, result ) )
                    continue
                else newPlayers.push(onlinePlayers[i])
            }

            // now to query newPlayers
            for( i = 0; i < newPlayers.length; i++ )
            {
                var slot = newPlayers[i].num
                var ip = newPlayers[i].ip
                var guid = newPlayers[i].id
                var ign = newPlayers[i].name
                var steamid = newPlayers[i].steamId

                await db.pool.query(`
                INSERT INTO clients 
                    ( ip, connections, guid, name, auto_login, time_add ) 
                VALUES ( '${ip}', 1, '${guid}', '${ign}', 1, UNIX_TIMESTAMP() )`)
                    .catch( ErrorHandler.fatal )
                    .then( res => updateClientInfo( slot, "id", res.insertId ) )    // not 100% sure, but looks like this is it

                updateClientInfo( slot, "noc", 1 )
                updateClientInfo( slot, "group_level", 0 )
                updateClientInfo( slot, "mask_level", 0 )
                updateClientInfo( slot, "time_add", Math.floor(Date.now()/1000) )
                updateClientInfo( slot, "time_edit", 0 )
                updateClientInfo( slot, "greeting", "" )
                updateClientInfo( slot, "ip", ip )
                updateClientInfo( slot, "steamid", steamid )

                // xlr stuff
                updateClientInfo( slot, "registered", false )
                updateClientInfo( slot, "kills", 0 )
                updateClientInfo( slot, "deaths", 0 )
                updateClientInfo( slot, "assists", 0 )
                updateClientInfo( slot, "tk", 0 )
                updateClientInfo( slot, "teamdeaths", 0 )
                updateClientInfo( slot, "suicides", 0 )
                updateClientInfo( slot, "ratio", 1.0 )
                updateClientInfo( slot, "roundsplayed", 0 )
                updateClientInfo( slot, "skill", 1000.0 )
                updateClientInfo( slot, "xlrhide", 0 )
            }
        }

        // obj = players who has connected to server before
        const obj = assignIDbyGUID( onlinePlayers, result )

        var idStr = ``
        for( var i = 0; i < obj.length; i++ )
        {
            updateClientInfo( obj[i].slot, "id", obj[i].id )
            updateClientInfo( obj[i].slot, "noc", obj[i].connections )
            updateClientInfo( obj[i].slot, "group_level", groupOperations.BitsToLevel(result[0].group_bits) )
            updateClientInfo( obj[i].slot, "mask_level", groupOperations.BitsToLevel(result[0].mask_level) )
            updateClientInfo( obj[i].slot, "time_add", obj[i].time_add )
            updateClientInfo( obj[i].slot, "time_edit", obj[i].time_edit )
            updateClientInfo( obj[i].slot, "greeting", obj[i].greeting )
            updateClientInfo( obj[i].slot, "ip", obj[i].ip )
            updateClientInfo( obj[i].slot, "steamid", obj[i].steamid )

            idStr += obj[i].id
            if( i < obj.length-1 )
                idStr += `,`
        }

        // now for xlrstats client props(result arr)
        // we'll do same thing again ig
        const xlrResult = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id IN(${idStr})`)
            .catch(ErrorHandler.fatal)

        // no one has registered yet
        if( !xlrResult.length )
        {
            for( var i = 0; i < obj.length ; i++ )
            {
                updateClientInfo( obj[i].slot, "registered", false )
                updateClientInfo( obj[i].slot, "kills", 0 )
                updateClientInfo( obj[i].slot, "deaths", 0 )
                updateClientInfo( obj[i].slot, "assists", 0 )
                updateClientInfo( obj[i].slot, "tk", 0 )
                updateClientInfo( obj[i].slot, "teamdeaths", 0 )
                updateClientInfo( obj[i].slot, "suicides", 0 )
                updateClientInfo( obj[i].slot, "ratio", 1.0 )
                updateClientInfo( obj[i].slot, "roundsplayed", 0 )
                updateClientInfo( obj[i].slot, "skill", 1000.0 )
                updateClientInfo( obj[i].slot, "xlrhide", 0 )
            }
        }
        else
        {
            // atleast 1 guy has registered

            const obj2 = await assignIDbyID( obj, xlrResult )

            console.log(obj2);

            // set props for registered players
            for( var i = 0; i < obj2.length; i++ )
            {
                if( obj2[i] == undefined )
                    continue
                updateClientInfo( obj2[i].slot, "registered", true )
                updateClientInfo( obj2[i].slot, "kills", obj2[i].kills )
                updateClientInfo( obj2[i].slot, "deaths", obj2[i].deaths )
                updateClientInfo( obj2[i].slot, "assists", obj2[i].assists )
                updateClientInfo( obj2[i].slot, "tk", obj2[i].teamkills )
                updateClientInfo( obj2[i].slot, "teamdeaths", obj2[i].teamdeaths )
                updateClientInfo( obj2[i].slot, "suicides", obj2[i].suicides )
                updateClientInfo( obj2[i].slot, "ratio", obj2[i].ratio )
                updateClientInfo( obj2[i].slot, "roundsplayed", obj2[i].rounds )
                updateClientInfo( obj2[i].slot, "skill", obj2[i].skill )
                updateClientInfo( obj2[i].slot, "xlrhide", obj2[i].hide )
            }

            if( obj.length != obj2.length )
            {
                // some players exist who didn't register
                // need to identify by id
                var unregPlayers = []
                for( var i = 0; i < obj.length; i++ )
                {
                    if( doesIDexistInObj(obj[i].id, obj2) )
                        continue
                    else unregPlayers.push(obj[i])
                }

                for( var i = 0; i < unregPlayers.length; i++ )
                {
                    updateClientInfo( unregPlayers[i].slot, "registered", false )
                    updateClientInfo( unregPlayers[i].slot, "kills", 0 )
                    updateClientInfo( unregPlayers[i].slot, "deaths", 0 )
                    updateClientInfo( unregPlayers[i].slot, "assists", 0 )
                    updateClientInfo( unregPlayers[i].slot, "tk", 0 )
                    updateClientInfo( unregPlayers[i].slot, "teamdeaths", 0 )
                    updateClientInfo( unregPlayers[i].slot, "suicides", 0 )
                    updateClientInfo( unregPlayers[i].slot, "ratio", 1.0 )
                    updateClientInfo( unregPlayers[i].slot, "roundsplayed", 0 )
                    updateClientInfo( unregPlayers[i].slot, "skill", 1000.0 )
                    updateClientInfo( unregPlayers[i].slot, "xlrhide", 0 )
                }
            }
            
        }
    }

    // now we begin with events
    eventhandler.player.on( 'connect', ( guid, slot, ign ) => onConnect( guid, slot, ign ) )
    // player.on( 'disconnect', ( guid, slot, ign ) => onDisconnect( guid, slot, ign ) )
}

async function getClientFromAgrs( slot, mode, arg )
{
    const pluginConf = conf.plugin.admin

    return new Promise( async(resolve,reject) =>
    {
        if( Number.isInteger(Number(arg)) )
        {
            if( arg => 0 && arg <= 64 )
            {
                if( !isSlotFilled(arg) )
                {
                    sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )
                    reject('SLOT_UNFILLED')
                }
                else resolve( await getClientObj( arg ) )
            }
        }
        else
        {
            if( arg.startsWith('@') && Number.isInteger(parseInt( arg.substring(1) ) ) )
            {
                var id = parseInt( arg.substring(1) )

                // if( !(await isClientInServer( id )) )
                //     return sendMsg( mode, slot, pluginConf.messages.cmd_err_notinserver )

                // get id from db and resolve it
                const result = await db.pool.query(`SELECT * FROM clients WHERE id=${id}`)
                    .catch( err =>
                        {
                            ErrorHandler.minor(err)
                            sendMsg( mode, slot, pluginConf.messages.cmd_err_processing_cmd )
                            reject( 'MYSQL_ERROR' )
                        } )

                if( !result.length )
                {
                    sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )
                    reject( 'ID_NONEXISTANT' )
                }
                else
                {
                    if( await isClientInServer( id ) )
                        resolve( await getClientObjByID(id) )
                    else resolve( result[0] )
                } 
            }
            else
            {
                var resultsFound = await getPlayerByNameToken( arg )

                if( !resultsFound.length )
                {
                    sendMsg( mode, slot, pluginConf.messages.cmd_err_no_players )
                    reject( 'TOKEN_MISMATCH' )
                }

                else if( resultsFound.length > 1 )
                {
                    var str = ``

                    for( var i = 0; i < resultsFound.length; i++ )
                    {
                        str += `${await getClientInfo( resultsFound[i], 'name' )}^3[^7${resultsFound[i]}^3]`

                        if( i != resultsFound.length-1 )
                            str += `^7, `
                    }
                    sendMsg( mode, slot, pluginConf.messages.players_matched.replace('%arg%',arg).replace('%players%',str) )
                    reject( 'MULTIPLE_TOKEN_MATCHES' )
                }
                else resolve( await getClientObj( resultsFound[0] ) )
            }
        }
    })
}

async function onConnect( guid, slot, ign )
{
    // here we add all info to client object of module.exports
    // including query fetched info
    updateClientInfo( slot, "slot", slot )  // i know
    updateClientInfo( slot, "name", ign )
    updateClientInfo( slot, "guid", guid ) 
    
    const { rcontool } = require('./rcon')
    const status = await rcontool.rconStatus()
    const onlinePlayers = await status.onlinePlayers
    
    for( i=0; i < onlinePlayers.length; i++ )
    if( onlinePlayers[i].num == slot )
    {
        updateClientInfo( slot, "score", onlinePlayers[i].score )   // needed?
        updateClientInfo( slot, "ping", onlinePlayers[i].ping )
        updateClientInfo( slot, "steamid", onlinePlayers[i].steamId )
        updateClientInfo( slot, "ip", onlinePlayers[i].ip )
    }
    
    var clientObj = await getClientObj( slot )
    // now fetching info from query
    // aliascount, penaltiescount, ipaliascount
    // kills, deaths, assists, tk, teamdeaths, suicides, roundsplayed, ratio, skill, winstreak, losestreak, xlrhide from xlr_playerstats

    const result = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${ clientObj.id }`)
        .catch( ErrorHandler.fatal )

    // now result[0] cant be undefined coz event is 'connect' not 'firstconnect'
    // TO-DO: separate xlr props to xlr plugin
    if( result.length )  // player registered
    {
        updateClientInfo( slot, "registered", true )
        updateClientInfo( slot, "kills", result[0].kills )
        updateClientInfo( slot, "deaths", result[0].deaths )
        updateClientInfo( slot, "assists", result[0].assists )
        updateClientInfo( slot, "tk", result[0].teamkills )
        updateClientInfo( slot, "teamdeaths", result[0].teamdeaths )
        updateClientInfo( slot, "suicides", result[0].suicides )
        updateClientInfo( slot, "ratio", result[0].ratio )
        updateClientInfo( slot, "roundsplayed", result[0].rounds )
        updateClientInfo( slot, "skill", result[0].skill )
        updateClientInfo( slot, "xlrhide", result[0].hide )
    }
    else    // player not registered
    {
        updateClientInfo( slot, "registered", false )
        updateClientInfo( slot, "kills", 0 )
        updateClientInfo( slot, "deaths", 0 )
        updateClientInfo( slot, "assists", 0 )
        updateClientInfo( slot, "tk", 0 )
        updateClientInfo( slot, "teamdeaths", 0 )
        updateClientInfo( slot, "suicides", 0 )
        updateClientInfo( slot, "ratio", 1.0 )
        updateClientInfo( slot, "roundsplayed", 0 )
        updateClientInfo( slot, "skill", 1000.0 )
        updateClientInfo( slot, "xlrhide", 0 )
    }
}

// get whole clientObj of 1 player matching by slot
async function getClientObj( slot )
{
    if( client == undefined )
        return undefined
    
    // TO-DO: improve from .find()?
    var clientObj = client.find( client => client.slot == slot )
    
    if( clientObj == undefined )
        return undefined

    return clientObj
}

// get whole clientObj of 1 player matching by db id
async function getClientObjByID( id )
{
    if( client == undefined )
        return undefined
    
    // TO-DO: improve from .find()?
    var clientObj = client.find( client => client.id == id )
    
    if( clientObj == undefined )
        return undefined

    return clientObj
}

// return 1 property of the clientObj which matches the slot
async function getClientInfo( slot, property )
{
    if( client == undefined )
        return undefined

    var clientObj = client.find( client => client.slot == slot )
        
    if( clientObj == undefined )
        return undefined
        
    return clientObj[property]
}

async function getPlayerByNameToken( token )
{
    if( client == undefined )
        return undefined

    token = token.toLowerCase()
    token = await removeSpaces(token)

    var resultsFound = []

    for( var i = 0; i < client.length; i++ )
    {
        var nameTok = client[i].name.toLowerCase()

        nameTok = await removeSpaces(nameTok)
        
        if( nameTok.includes(token) )
            resultsFound.push( client[i].slot )
    }

    return resultsFound
}

async function removeSpaces(str)
{
    str = [...str]
    for( var j = 0; j < str.length; j++ )
    {
        if( str[j] == ' ' )
            str.splice(j,1)
    }
    return str.join('')
}

async function isClientInServer( id )
{
    for( var i = 0; i < client.length; i++ )
        if( client[i].id == id )
            return true

    return false
}

async function isSlotFilled( slot )
{
    if( client == undefined )
        return false
    
    // TO-DO: improve from .find()?
    var clientObj = client.find( client => client.slot == slot )
    
    if( clientObj == undefined )
        return false

    return true
}

// update 1 property of the clientObj which matches slot
async function updateClientInfo( slot, property, value )
{
    if( client == undefined )
        client = []

    var clientObj = client.find( client => client.slot == slot )

    // create new entry if empty
    if( clientObj == undefined )
    {
        client[client.length] = {}
        clientObj = client[client.length-1]
        clientObj.slot = slot
    }

    if( slot == undefined || property == undefined || value == undefined )
        return ErrorHandler.minor(`Error in updateClientInfo(): one of the args was undefined.\nSLOT: ${slot}\nProperty: ${property}\nValue: ${value}`)

    clientObj[property] = value
}

// assignID: sync UDP(onlinePlayers) and MySQL(clients table) queries by GUID
function assignIDbyGUID( players, result )
{
	obj = []
	for( var i = 0; i < players.length; i++ )
		for( var j = 0; j < result.length; j++ )
			if( players[i].id == result[j].guid )
            {
				obj[i]=result[j]
                obj[i].slot = players[i].num
                obj[i].steamid = players[i].steamId
            }

	return obj;
}

// assignID: sync data from clients and other tables by database id
function assignIDbyID( q1, q2 )
{
	var obj = []
	for( var i = 0; i < q1.length; i++ )
		for( var j = 0; j < q2.length; j++ )
			if( q1[i].id == q2[j].client_id )
            {
				obj[i]=q2[j]
                obj[i].slot = q1[i].slot
            }

	return obj;
}

function doesGUIDExistInQuery( id, query )
{
    for( var i = 0; i < query.length; i++ )
        if( query[i].guid == id )
            return true
    return false
}

function doesIDexistInObj( id, obj2 )
{
    for( var j = 0; j < obj2.length; j++ )
        if( id == obj2[j].id )
            return true
    return false
}