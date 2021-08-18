
var GlobalMaps = []

module.exports = 
{
    GlobalMaps,
    updateMapsObj,
    
    init: async function()
    {
        // read .txt, validate it, throw errors if needed
        var rl = require('readline').createInterface( {input: fs.createReadStream('./sql/templates/defaultgroups.sql'), output: process.stdout, terminal: false } );
	
        rl.on( 'error', err => ErrorHandler.fatal(err) )

        // on reading each line
        rl.on( 'line', (line)=>
            {
                if( line.startsWith('//') || line.trim() == "" )
                    return

                // renove extra white spaces
                line = line.trim()

                // now to split using ":" and creating properties for global maps object
                line = line.split(':')

                // each obj will have 3 properties: token, Name and aliases(array)
                // aliases will always contain token minus mp_ and Name.tolower

                token = line[0]

                // now to process everything after ":" which might contain ","

                if( line[1] == undefined || line[1].length < 3 )
                {
                    ErrorHandler.minor(`Warning: Mapname for "${line[0]}" not properly specified, using maptoken`)
                    line[1] = line[0]
                }

                var cont = line[1].split(',')
                
                // TO-DO: do better job

                updateMapsObj( token, "Name", cont[0] )
                updateMapsObj( token, "aliases", cont[0].toLowerCase() )
                
                if( cont.length == 1 )  // no aliases
                {
                    // set name = cont[0]
                    
                }
                else
                {
                    // process cont
                    updateMapsObj( token, "aliases", cont[1].toLowerCase() )

                }
            })

        rl.on( 'close', ()=> {
            // notify to console
                
        })
    },

    getName: async function( token )
    {
        
    },

    getAliases: async function( token )
    {

    }
}

function updateMapsObj( token, property, value )
{
    token = token.toLowerCase()

    var index = GlobalMaps .indexOf( mapObj => mapObj.token==token )

    if( index < 0 )   // doesnt exist yet
    {
        index = GlobalMaps.length+1
        GlobalMaps[index-1] = {}
        GlobalMaps[index].token = token
    }

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