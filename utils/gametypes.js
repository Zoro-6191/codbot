require('rootpath')()
const fs = require('fs')
const ErrorHandler = require('src/errorhandler')
const { DebugMode } = require('conf')
const conf = require('conf')

var GlobalGametypes = []

module.exports = 
{
    updateGametypeInfo,
    
    init: async function()
    {
        // read .txt, validate it, throw errors if needed
        var rl = require('readline').createInterface( {input: fs.createReadStream('./conf/gametypes.txt'), output: process.stdout, terminal: false } );
	
        rl.on( 'error', ErrorHandler.fatal )

        // on reading each line
        rl.on( 'line', (line)=>
            {
                // remove extra white spaces
                line = line.trim()

                if( line.startsWith('//') || line.trim() == "" )
                    return

                // now to split using ":" and creating properties for global object
                line = line.split(':')

                // each obj will have 3 properties: token, name and aliases(array)
                // aliases will always contain token minus mp_ and name.tolower
                token = line[0]

                // now to process everything after ":" which might contain ","

                if( line[1] == undefined || line[1].length < 3 )
                {
                    ErrorHandler.minor(`Warning: Gametype name for "${line[0]}" not properly specified, using gametype token`)
                    line[1] = line[0]
                }
                var cont = line[1].split(',')

                for( var i = 0; i < cont.length; i++ )
                    cont[i] = cont[i].trim()

                updateGametypeInfo( token, "name", cont[0] )
                updateGametypeInfo( token, "aliases", cont[0].toLowerCase() )

                // process cont
                for( var i = 1; i < cont.length; i++ )
                    updateGametypeInfo( token, "aliases", cont[i].toLowerCase() )
            })

        rl.on( 'close', ()=> {
            // notify to console
            // console.log(GlobalGametypes);
            module.exports.GlobalGametypes = GlobalGametypes
        })
    },

    getName: async function( token )
    {
        
    },

    getAliases: async function( token )
    {

    },
    
    isValidGametype: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalGametypes.length; i++ )
            if( GlobalGametypes[i].token == token || GlobalGametypes[i].aliases.includes(token) )
                return true

        return false
    },

    getGametype: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalGametypes.length; i++ )
            if( GlobalGametypes[i].token == token || GlobalGametypes[i].aliases.includes(token) )
                return GlobalGametypes[i]

        return undefined
    }
}

function updateGametypeInfo( token, property, value )
{
    token = token.toLowerCase()

    var obj = GlobalGametypes.find( GTObj => GTObj.token==token )

    if( obj == undefined )   // doesnt exist yet
    {
        GlobalGametypes[GlobalGametypes.length] = {}
        var index = GlobalGametypes.length-1
        GlobalGametypes[index].token = token
    }
    else var index = GlobalGametypes.indexOf(obj)   

    if( property != 'aliases' )
        GlobalGametypes[index][property] = value
    else
    {
        value = value.toLowerCase()
        if( GlobalGametypes[index]['aliases'] == undefined )
            GlobalGametypes[index]['aliases'] = []
        else if( GlobalGametypes[index]['aliases'][value] != undefined )
            return console.log(`Duplicate push to gametype aliases aliases for "${GlobalGametypes[index].token}"`)

            GlobalGametypes[index]['aliases'].push(value)
    }
}