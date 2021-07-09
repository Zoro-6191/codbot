// this line initiates our bot
const logread = require("./logread.js")
// TO-DO: CLI args?

// =================================================
// create read stream
// connect to mysql db and keep it alive
// analyze each line and store in perm vars/emit events for it
// create a standard for the plugins
// =================================================

// PART 1: start stream
logread.init()