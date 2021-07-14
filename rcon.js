// this file takes care of all rcon command sending related stuff
// TO-DO: exception handling

module.exports.initRcon = async function()
{
    const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
	const server = require('./conf').mainconfig.server

    const UDP = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )

    module.exports.rcon = UDP
    
    console.log("Initialized: Rcon Tool by arbytez")
}