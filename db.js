// this file takes care of mysql database and its connectivity to rest of the project
const mysql = require('mysql')
const { mysqldb } = require('./conf')

module.exports = 
{
	init: function()
    {
		this.connection = mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		});
		console.log(`Connected to MySQL Database`)
		this.keepAlive();
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