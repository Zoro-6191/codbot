// this file takes care of mysql database and its connectivity to rest of the project
// TO-DO: check database integrity
const mysql = require('mysql')
const { exit } = require('process')
const ErrorHandler = require('./errorhandler')
const { bot } = require('./eventhandler')

module.exports = 
{
	initMySQLdb: async function()
    {
		const mainconfig = require('./conf').mainconfig
		const { bot } = require('./eventhandler')
		
		mysqldb = mainconfig.mysqldb

		// now check if user has entered workable entries in config, has to be in sync
		await checkConfigEntries( mysqldb )
		
		// initiate connection
		this.connection = mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		});
		// for non database related queries, can't imagine it being used much
		this.pool = mysql.createPool(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password
		});
		this.keepAlive();

		// now to check if host/user/pass are correct and database exists and we have access to it:
		// this.connection.query(`SELECT *  FROM information_schema WHERE TABLE_NAME = "my_table"`)
		await this.connection.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${mysqldb.database}'`, ( err, result )=>
		{
			if( err != undefined && err.code == 'ECONNREFUSED' )
				ErrorHandler.fatal( `MySQL Server refused connection.\nThis means either the MySQL server is down or has blocked this IP Address.` )

			if( err != undefined && err.code == 'ER_ACCESS_DENIED_ERROR' )
				ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )

			if( err != undefined && err.code == 'ER_BAD_DB_ERROR' )	// database doesn't exist
			{
				// maybe give user option to create a database right now
				const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout })
				rl.question(`Database "${mysqldb.database}" doesn't exist. Create one right now? (y/n)\n-> `, (input)=>
				{
					input = input.toLowerCase()
					if(input!='y'&&input!='n'){ ErrorHandler.minor(`Invalid input: ${input}. Quitting..`);exit(1); }	// anything other than y/n
					
					if( input == 'y' )
					{
						console.log(`Creating Database "${mysqldb.database}"`)

						var sql = `CREATE DATABASE ${mysqldb.database};`
						
						this.pool.query( sql, (err,result)=> {
							if( err || result == undefined)
								ErrorHandler.fatal(`Error while creating database\n${err?err:'Query returned empty object'}`)
							
							console.log(`Successful`);
							// TO-DO: maybe setup basic tables here n now
							// aliases, clients, current_clients, current_svars, groups, ipaliases, penalties, xlr?
						})
					}
					else { ErrorHandler.minor(`Can't continue without a database. Quitting...`);exit(1); }
					bot.emit('database_ready')
				})
			}
			
			if( result != undefined && result[0] != undefined )	// table already exists		// [ RowDataPacket { SCHEMA_NAME: 'codbot' } ]
			{
				bot.emit('database_ready')
			}
		})
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

function checkConfigEntries( mysqldb )
{
	// host can be pretty much anything
	// but can't contain spaces

	Object.keys(mysqldb).forEach( item => 
	{
		// trim() = remove white spaces
		if( item != "port" )
			mysqldb[item].trim()

		// for idiots
		if( item != "port" && mysqldb[item].split(' ').length > 1 )
			ErrorHandler.fatal(`Invalid Entry in JSON\nFile: /conf/codbot.json\nIn property "${item}" of mysqldb\nSpaces are not allowed: "${mysqldb[item]}"`)
	});
}