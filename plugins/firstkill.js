require('rootpath')()
const { updateClientInfo } = require("utils/client")
const { DebugMode } = require('conf')
const db = require('utils/db')
const { sendMsg } = require('utils/msnger')
const conf = require('conf')
const { groupOperations } = require('utils/groups')
const rcon = require('utils/rcon')
const clientModule = require('utils/client')
const ErrorHandler = require('src/errorhandler')
const eventhandler = require('src/eventhandler')
const { wait, msToTime } = require('utils/utility')

const { getClientFromAgrs, getClientObj, isSlotFilled, getPlayerByNameToken, getClientInfo, isClientInServer } = clientModule

// vars for local use
var mainconfig, pluginConf

module.exports = 
{
    init: async function()
    {
        pluginConf = conf.plugin.firstkill
        mainconfig = conf.mainconfig
    }
}