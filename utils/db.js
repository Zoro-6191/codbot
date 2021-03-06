// this module takes care of mysql database and its connectivity to rest of the project
require('rootpath')()
const fs = require('fs')
const mysql = require('promise-mysql')
const { exit } = require('process')
const ErrorHandler = require('src/errorhandler')
require('colors')

var requiredTables = [ 'aliases', 'clients', 'ctime', 'callvote',
						// 'current_clients', 'current_svars', 	// TO-DO: later
						'groups', 'ipaliases', 
						'penalties', 'xlr_actionstats', 'xlr_bodyparts',
						'xlr_history_monthly', 'xlr_history_weekly', 'xlr_mapstats',
						'xlr_opponents', 'xlr_playeractions', 'xlr_playerbody',
						'xlr_playermaps', 'xlr_playerstats', 'xlr_weaponstats', 
						'xlr_weaponusage' ]

var pool, connection

module.exports = 
{
	initMySQLdb: async function()
    {
		const mainconfig = require('conf').mainconfig

		mysqldb = mainconfig.mysqldb

		// now check if user has entered workable entries in config, has to be in sync
		await checkConfigEntries( mysqldb )

		// no database async connection
		pool = await mysql.createPool(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password
			})
		
		// synchronous connection
		connection = await mysql.createConnection(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password,
				database: mysqldb.database
			})
			.then( DBExistsGoAhead )
			.catch( async (err) => 
				{
					if( err.code == 'ECONNREFUSED' )
						ErrorHandler.fatal( `MySQL Server refused connection.\nThis means the MySQL server is either down or has blocked this IP Address.` )

					if( err.code == 'ER_ACCESS_DENIED_ERROR' )
						ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )

					if( err.code == 'ER_BAD_DB_ERROR' )	// database doesn't exist
					{
						// maybe give user option to create a database right now
						const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout })
						rl.question(`\n Database "${mysqldb.database}" doesn't exist.`.red.bgBlack +` Create one right now? (y/n)`.cyan.bgBlack+`\n-> `.cyan, async (input)=>
						{
							input = input.toLowerCase()
							if( input != 'y' && input != 'n' ){ ErrorHandler.minor(`Invalid input: ${input}. Quitting..`);exit(1); }	// anything other than y/n
							
							if( input != 'y' )
							{
								ErrorHandler.minor(`Can't continue without a database. Quitting...`);
								exit(1);
							}
							console.log(  `Creating Database "${mysqldb.database}"`.yellow )

							await pool.query( `CREATE DATABASE ${mysqldb.database};` )
								.then(async ()=>
								{
									// re-establish connection
									connection = await mysql.createConnection(
										{
											host: mysqldb.host,
											port: mysqldb.port,
											user: mysqldb.user,
											password: mysqldb.password,
											database: mysqldb.database
										}).catch( err => ErrorHandler.fatal(`Error in re-establishing connection to MySQL Server after creating DB\n${err}`) )
								})
								.then( () =>
								{
									console.log(`- Done\n`.green)
									DBExistsGoAhead()
								})
								.catch( err => ErrorHandler.fatal(`Error while creating database\n${err}`) )
						})
					}
				})
		
		this.keepAlive();
	},
	keepAlive: async function()
    {
		setInterval( ()=> module.exports.pool.query('SELECT 1') , 100000 );	// every 100seconds, should be fine
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
	})
}

async function DBExistsGoAhead()
{
	var currentTables = []
	var missingTables = []

	// update database in pool
	pool = await mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		}).catch( ErrorHandler.fatal ) // can it even get here

	module.exports.pool = pool
		
	// now to check what tables exists and what not
	const result = await pool.query( `SHOW TABLES;` )
		.catch( ErrorHandler.fatal )

	if( result.length == 0 )
		console.log(`No tables exist in the database`.red+`\nCreating`.yellow)
	else for( i=0; i< result.length; i++ )
		currentTables[i] = result[i][`Tables_in_${mysqldb.database}`]

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
			console.log(`Existing Tables:`.yellow)
			console.log(currentTables)
		}
		CreateMissingTables( missingTables )
	}
	else TablesReadyGoAhead()
}

async function CreateMissingTables( missingTables )
{
	console.log( `Missing Tables:`.red )
	console.log(missingTables)

	// now to take table schema from template and query it
	// we doing it one by one to avoid exceptions as much as possible

	for( var i=0; i < missingTables.length; i++ )
	{
		const table = missingTables[i]
		var template = fs.readFileSync(`./sql/templates/${table}.sql`,'utf-8')

		await pool.query( template )
			.then( () =>
			{
				console.log( `Created Table: "${table}"` )
				
				// worst case scenario: db has 200ms ping to server. 1s should be enough
				// setTimeout( bot.emit('database_ready'), 1000 )	// dont work for some reason
				// emit event after last query
			}) 
			.catch( ErrorHandler.fatal )

		if( i == missingTables.length - 1 )
			{
				console.log('- Done Creating Missing Tables\n'.green);
				TablesReadyGoAhead()
			}
	}
}

async function TablesReadyGoAhead()
{
	const { bot } = require('src/eventhandler')

	// check if "clients" table has WORLD id
	const result = await pool.query(`SELECT * FROM clients WHERE id=1`)
		.catch( ErrorHandler.fatal )

	if( result.length )
	{
		if( result[0].guid == 'WORLD' )
		{
			// world id exists
			// now we check its values and increment connections and time_edit
			await pool.query(`
			UPDATE
				clients
			SET
				connections=connections+1,
				time_edit=UNIX_TIMESTAMP()
			WHERE
				id=1
			`)
				.catch( ErrorHandler.fatal )
				.then( bot.emit('database_ready') )
		}
		// ID 1 is occupied by a player's guid
		else ErrorHandler.fatal( `WORLD ID doesn't exist in database. Cannot Continue. Resetting entire database is the only solution.` )
	}
	else
	{
		// world id doesnt exist
		console.log(`World ID doesn't exist yet.`.red+`\n- Creating`.yellow)
		await pool.query(`
			INSERT INTO clients
				(connections,guid,pbid,name,auto_login,time_add,time_edit)
			VALUES(
				1,
				'WORLD',
				'WORLD',
				'World',
				1,
				UNIX_TIMESTAMP(),
				UNIX_TIMESTAMP()
			)`)
			.catch( ErrorHandler.fatal )
			.then( ()=>
			{
				console.log( '- Done\n'.green );
				bot.emit('database_ready')
			})
	}
}