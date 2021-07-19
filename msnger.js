// this module takes care of sending messages to server/player
const rcon = require('./rcon.js')
const conf = require('./conf')

module.exports = 
{
    replacePlaceholder,
    sendMsg,
}

module.exports.init = async function()
{
    // change all placeholders to values in config

    // console.log(conf.plugin)

    const pluginObj = conf.plugin

    Object.keys(pluginObj).forEach( pl=>
    {
        // messages
        if( pluginObj[pl].messages != undefined )
        Object.keys(pluginObj[pl].messages).forEach( string => 
            {
                replacePlaceholder( pluginObj[pl].messages[string], '%prefix', '!')
            })

        // commandhelp
        if( pluginObj[pl].commandhelp != undefined )
        Object.keys(pluginObj[pl].commandhelp).forEach( string => 
            {
                replacePlaceholder( pluginObj[pl].commandhelp[string], '%prefix', '!')
            })
            
        // commandusage
        if( pluginObj[pl].commandusage != undefined )
        Object.keys(pluginObj[pl].commandusage).forEach( string => 
            {
                replacePlaceholder( pluginObj[pl].commandusage[string], '%prefix%', '!')
            })
    })
}

async function sendMsg( mode, slot, msg )
{
    // send in sequences?
    // changeline?
    if( mode == 'p' )
        rcon.rcontool.tell( slot, msg )
    else if( mode == 'g')
        rcon.rcontool.say( msg )
}

async function replacePlaceholder( string, holder, value )
{
    string = string.replace(holder,value)
}