// this module takes care of sending messages to server/player
require('rootpath')()
const rcon = require('utils/rcon.js')
const conf = require('conf')
const { wait } = require('utils/utility')

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
    msg = msg.match(/.{1,100}/g)    // divide into 100 char divisions

    for( var i = 0; i  < msg.length; i++ )
    {
        if( mode == 'p' )
            rcon.rcontool.tell( slot, msg[i] )
        else if( mode == 'g')
            rcon.rcontool.say( msg[i] )
        
        await wait( 500 )
    }
}

async function replacePlaceholder( string, holder, value )
{
    return new Promise( (resolve,reject) => 
    {
        if( typeof string != "string" )
            reject('NOT_STRING')
        string = string.replace(holder,value)
        resolve(string)
    })
}