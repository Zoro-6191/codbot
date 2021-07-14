// this file takes care of mysql database and its connectivity to rest of the project
// TO-DO: check database integrity
const mysql = require('mysql')
const eventhandler = require('./eventhandler')

module.exports = 
{
	initMySQLdb: function()
    {
		const mainconfig = require('./conf').mainconfig
		mysqldb = mainconfig.mysqldb
		this.connection = mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		});
		this.keepAlive();
		// console.log(`Initialized: MySQL Database`)
		console.log(eventhandler)
	},
	keepAlive: async function()
    {
		setInterval( ()=>
        {
			this.connection.query('SELECT 1');
		}, 100000 );	// every 100seconds, should be fine
	},
	info: function(){ return this.connection }
}