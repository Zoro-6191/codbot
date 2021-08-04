
var maps = {}

module.exports = 
{
    maps,
    
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
            })

        // notify to console
        rl.on( 'close', ()=> {
            console.log(`Initiated Default Groups:\n	100 - Super Admin\n	80 - Senior Admin\n	60 - Full Admin\n	40 - Admin\n	20 - Moderator\n	2 - Regular\n	1 - User\n	0 - Guest`)
            // now to forward to creating global group object
            // createGlobalGroups()
            // just querying again is probably best
            db.pool.query( `SELECT * FROM groups;`, (err,result)=>{
                if( err )
                    ErrorHandler.fatal(`Error while creating global Groups object\n${err}`)
                else createGlobalGroups( result )
            })
        })
    },

    getNameFromToken: async function( token )
    {
        
    }
}