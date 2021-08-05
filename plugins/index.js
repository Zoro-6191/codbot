const { DebugMode } = require.main.require('./conf')
const ErrorHandler = require.main.require('./src/errorhandler')
const conf = require.main.require('./conf')

module.exports.init = async function()
{
    // take plugin names outta mainconfig and call init
    // thats all
    
    var plugins = conf.mainconfig.plugins

    Object.keys(plugins).forEach( pl =>
        {
            if(plugins[pl])
                require(`./${pl}.js`).init()
        })
}