const mysql = require('mysql')
require('colors')

module.exports = 
{
	init: function()
    {
		this.connection = mysql.createConnection(
		{
			host: b3db_host,
			user: b3db_user,
			password: b3db_password,
			database: b3db_database
		});
		util.log(`Connected to MySQL Database.`.green.bold)
		this.keepAlive();
	},
	keepAlive: async function()
    {
		setInterval( ()=>
        {
			this.connection.query('SELECT 1');
		}, 100000 );	// every 100seconds
	},
	info: function(){ return this.connection }
}