// this line initiates our bot
const logread = require("./logread.js")
const db = require('./db')
require('colors')
const { player } = require('./eventhandler')
// TO-DO: CLI args?

// =================================================
// create read stream
// connect to mysql db and keep it alive
// analyze each line and store in perm vars/emit events for it
// create a standard for the plugins
// =================================================

// PART 1: start stream
db.init()   // connect to mysql database
logread.init()  // begin reading logfile

player.on('connect', ( guid, slot, name )=>{
    console.log(`=========================`)
    console.log(`Player Connected:`)
    console.log(`Name: ${name}`)
    console.log(`GUID: ${guid}`)
    console.log(`Slot: ${slot}`)
    console.log(`=========================`)
})