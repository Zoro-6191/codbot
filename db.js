// this module takes care of mysql database and its connectivity to rest of the project
const fs = require('fs')
const mysql = require('mysql')
const { exit } = require('process')
const ErrorHandler = require('./errorhandler')

var requiredTables = [ 'aliases', 'clients', 'ctime', 'callvote',
						// 'current_clients', 'current_svars', 	// TO-DO: later
						'groups', 'ipaliases', 
						'penalties', 'xlr_actionstats', 'xlr_bodyparts',
						'xlr_history_monthly', 'xlr_history_weekly', 'xlr_mapstats',
						'xlr_opponents', 'xlr_playeractions', 'xlr_playerbody',
						'xlr_playermaps', 'xlr_playerstats', 'xlr_weaponstats', 
						'xlr_weaponusage' ]	

module.exports = 
{
	initMySQLdb: async function()
    {
		const mainconfig = require('./conf').mainconfig
		const { bot } = require('./eventhandler')
		
		mysqldb = mainconfig.mysqldb

		// now check if user has entered workable entries in config, has to be in sync
		await checkConfigEntries( mysqldb )
		
		// synchronous connection
		this.connection = mysql.createConnection(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password,
				database: mysqldb.database
			});

		// async connection
		// parallel queries can be executed
		this.pool = mysql.createPool(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password
			});

		this.query = this.pool.query
		this.keepAlive();

		// now to check if host/user/pass are correct and database exists and we have access to it:
		// this.connection.query(`SELECT *  FROM information_schema WHERE TABLE_NAME = "my_table"`)
		this.connection.query(`SELECT * FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${mysqldb.database}'`, ( err, result )=>
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
						
						this.pool.query( sql, (err,result)=> 
							{
								if( err || result == undefined)
									ErrorHandler.fatal(`Error while creating database\n${err?err:'Query returned empty object'}`)
								
								console.log(`Successful`)

								// re-establish connection
								this.connection = mysql.createConnection(
									{
										host: mysqldb.host,
										port: mysqldb.port,
										user: mysqldb.user,
										password: mysqldb.password,
										database: mysqldb.database
									});

								// TO-DO: maybe setup basic tables here n now
								// aliases, clients, current_clients, current_svars, groups, ipaliases, penalties, xlr?
								DBExistsGoAhead()
							})
					}
					else { ErrorHandler.minor(`Can't continue without a database. Quitting...`);exit(1); }
				})
			}
			
			if( result != undefined && result[0] != undefined )	// database already exists		// [ RowDataPacket { SCHEMA_NAME: 'codbot' } ]
			{
				DBExistsGoAhead()
			}
		})
	},
	keepAlive: async function()
    {
		setInterval( ()=>
        {
			this.pool.query('SELECT 1');
		}, 100000 );	// every 100seconds, should be fine
	},
	info: function(){ return this.pool }
}

function checkConfigEntries( mysqldb )
{
	// host can be pretty much anything
	// but can't contain spaces

	Object.keys(mysqldb).forEach( property => 
	{
		if( property != "port" )
		{
			mysqldb[property] = mysqldb[property].trim()	// remove extra white spaces from line start and end

			// for idiots
			if( mysqldb[property].split(' ').length > 1 )
				ErrorHandler.fatal(`Invalid Entry in JSON\nFile: /conf/codbot.json\nIn property "${property}" of mysqldb\nSpaces are not allowed: "${mysqldb[property]}"`)
		}
	});
}

function DBExistsGoAhead()
{
	const { bot } = require('./eventhandler')

	var currentTables = []
	var missingTables = []

	// update database in pool
	module.exports.pool = mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		});

	// now to check what tables exists and what not
	module.exports.pool.query( `SHOW TABLES;`, async (err, result)=> {
		if( err )
			ErrorHandler.fatal(err)
		else if( result.length == 0 )
			console.log(`No tables exist\nCreating`)
		else for( i=0; i< result.length; i++ )
			currentTables[i] = result[i].Tables_in_codbot

		// check for missing tables

		// looping through arrays is not really required
		// could only use 'CREATE TABLE IF NOT EXISTS'
		// but then we won't really know which table was missing
		// and which ones we needed to insert
		// and there'll be useless giant queries
		// all of this is done considering b3 database can be used with codbot

		for( i=0 ; i < requiredTables.length ; i++ )
			if(!currentTables.includes(requiredTables[i])) 
				missingTables.push(requiredTables[i]);

		if( missingTables.length > 0 )
		{
			if( currentTables.length > 0 )	// atleast 1 table exists in db
			{
				console.log(`Current Tables:`)
				console.log(currentTables)
			}
			CreateMissingTables( missingTables )
		}
		else bot.emit('database_ready')
	} )
}

async function CreateMissingTables( missingTables )
{
	console.log(`Missing Tables:`)
	console.log(missingTables)

	// now to take table schema from template and query it
	// we doing it one by one to avoid exceptions as much as possible

	for( var i=0; i < missingTables.length; i++ )
	{
		const table = missingTables[i]
		var template = fs.readFileSync(`./sql/templates/${table}.sql`,'utf-8')

		module.exports.query( template, async (err, result)=>{
			if(err)
				ErrorHandler.fatal(err)
			else console.log(`Created Table: "${table}"`)
		} )
	}
	// worst case scenario: db has 200ms ping to server. 1s should be enough
	// setTimeout( bot.emit('database_ready'), 1000 )	// dont work for some reason
	bot.emit('database_ready')
}