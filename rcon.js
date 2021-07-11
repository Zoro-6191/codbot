// this file takes care of all rcon command sending related stuff
const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
const { server } = require('./conf').mainconfig

module.exports.init = async function()
{
    const UDP = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )
    module.exports.rcon = UDP
}