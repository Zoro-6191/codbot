// this file takes care of mysql database and its connectivity to rest of the project
// TO-DO: check database integrity
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
		await this.connection.query(`SELECT * FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${mysqldb.database}'`, ( err, result )=>
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
			this.connection.query('SELECT 1');
		}, 100000 );	// every 100seconds, should be fine
	},
	info: function(){ return this.connection }
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

	// now to check what tables exists and what not
	module.exports.connection.query( `SHOW TABLES;`, async (err, result)=> {
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
		// all of this is done considering b3 database can be used with codbot

		for( i=0 ; i < requiredTables.length ; i++ )
			if(!currentTables.includes(requiredTables[i])) 
				missingTables.push(requiredTables[i]);

		if( missingTables.length > 0 )
		{
			if( currentTables.length > 0 )	// atleast 1 table exists
			{
				console.log(`Current Tables:`)
				console.log(currentTables)
			}
			await CreateMissingTables( missingTables )
		}

		bot.emit('database_ready')
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

		module.exports.connection.query( template, async (err, result)=>{
			if(err)
				ErrorHandler.fatal(err)
			else console.log(`Created Table: "${table}"`);

			if( table == 'groups')
				await initGroupTable()
		} )
	}
}

async function initGroupTable()
{
	var rl = require('readline').createInterface( {input: fs.createReadStream('./sql/templates/defaultgroups.sql'), output: process.stdout, terminal: false } );
	rl.on( 'line', (line)=>{

		module.exports.connection.query( line, (err,result)=>{
			if(err)
				ErrorHandler.fatal(err)
		})
	})
	rl.on( 'close', ()=> console.log(`Initiated Default Groups:
	100 - Super Admin
	80 - Senior Admin
	60 - Full Admin
	40 - Admin
	20 - Moderator
	2 - Regular
	1 - User
	0 - Guest`))
}