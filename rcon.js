// this file takes care of all rcon command sending related stuff
const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
const conf = require('./conf')

module.exports.init = async function()
{
    console.log("Initializing Rcon")
	var server = conf.mainconfig.server
    const UDP = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )
    module.exports.rcon = UDP
    console.log("Initializing Rcon Complete")
}