// this file takes care of all rcon command sending related stuff

module.exports.initRcon = async function()
{
    const conf = require('./conf')
    const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
	var server = conf.mainconfig.server
    const UDP = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )
    module.exports.rcon = UDP
    console.log("Initialized: Rcon")
}