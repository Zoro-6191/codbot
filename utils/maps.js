require('rootpath')()
const fs = require('fs')
const ErrorHandler = require('src/errorhandler')
const { DebugMode } = require('conf')
const conf = require('conf')

var GlobalMaps = []

module.exports = 
{
    updateMapInfo,
    
    init: async function()
    {
        var rl = require('readline').createInterface( {input: fs.createReadStream('./conf/maps.txt'), output: process.stdout, terminal: false } );
	
        rl.on( 'error', ErrorHandler.fatal )

        rl.on( 'line', (line)=>
            {
                // remove extra white spaces
                line = line.trim()

                if( line.startsWith('//') || line.trim() == "" )
                    return

                // now to split using ":" and creating properties for global maps object
                line = line.split(':')

                // each obj will have 3 properties: token, name and aliases(array)
                // aliases will always contain token minus mp_ and name.tolower

                token = line[0]

                // now to process everything after ":" which might contain ","

                if( line[1] == undefined || line[1].length < 3 )
                {
                    ErrorHandler.minor(`Warning: Mapname for "${line[0]}" not properly specified, using maptoken`)
                    line[1] = line[0]
                }
                var cont = line[1].split(',')

                for( var i = 0; i < cont.length; i++ )
                    cont[i] = cont[i].trim()

                updateMapInfo( token, "name", cont[0] )
                updateMapInfo( token, "aliases", cont[0].toLowerCase() )

                // process cont
                for( var i = 1; i < cont.length; i++ )
                    updateMapInfo( token, "aliases", cont[i].toLowerCase() )
            })

        rl.on( 'close', ()=> {
            // notify to console
            // console.log(GlobalMaps);
            module.exports.GlobalMaps = GlobalMaps
        })
    },

    getName: async function( token )
    {
        
    },

    getAliases: async function( token )
    {

    },
    
    isValidMap: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalMaps.length; i++ )
            if( GlobalMaps[i].token == token || GlobalMaps[i].aliases.includes(token) )
                return true

        return false
    },

    getMap: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalMaps.length; i++ )
            if( GlobalMaps[i].token == token || GlobalMaps[i].aliases.includes(token) )
                return GlobalMaps[i]

        return undefined
    }
}

function updateMapInfo( token, property, value )
{
    token = token.toLowerCase()

    var obj = GlobalMaps.find( mapObj => mapObj.token==token )

    if( obj == undefined )   // doesnt exist yet
    {
        GlobalMaps[GlobalMaps.length] = {}
        var index = GlobalMaps.length-1
        GlobalMaps[index].token = token
    }
    else var index = GlobalMaps.indexOf(obj)   

    if( property != 'aliases' )
        GlobalMaps[index][property] = value
    else
    {
        value = value.toLowerCase()
        if( GlobalMaps[index]['aliases'] == undefined )
            GlobalMaps[index]['aliases'] = []
        else if( GlobalMaps[index]['aliases'][value] != undefined )
            return console.log(`Duplicate push to map aliases for "${GlobalMaps[index].token}"`)

            GlobalMaps[index]['aliases'].push(value)
    }
}