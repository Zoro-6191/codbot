// this module takes care of admin groups
const db = require('./db')
const ErrorHandler = require('./errorhandler')

module.exports.init = async function()
{
    
}

module.exports.groupOperations = 
{
    BitsToLevel,
    BitsToToken,
    BitsToName,
    TokenToLevel,
    TokenToBits
}

function BitsToLevel( bits )
{
    switch( bits )
    {
        case 128: return 100;
        case 64: return 80;        
        case 32: return 60;        
        case 16: return 40;
        case 8: return 20;        
        case 2: return 2;
        case 1: return 1;
        case 0: return 0;
    }
}

function BitsToToken( bits )
{
    switch( bits )
    {
        case 128: return "superadmin";
        case 64: return "senioradmin";        
        case 32: return "fulladmin";        
        case 16: return "admin";
        case 8: return "mod";        
        case 2: return "reg";
        case 1: return "user";
        case 0: return "guest";
    }
}

function BitsToName( bits )
{
    switch( bits )
    {
        case 128: return "Super Admin";
        case 64: return "Senior Admin";        
        case 32: return "Full Admin";        
        case 16: return "Admin";
        case 8: return "Moderator";        
        case 2: return "Regular";
        case 1: return "User";
        case 0: return "Guest";
    }
}

function TokenToLevel( token )
{
    switch( token )
    {
        case "superadmin": return 100;
        case "senioradmin": return 80;        
        case "fulladmin": return 60;        
        case "admin": return 40;
        case "mod": return 20;        
        case "reg": return 2;
        case "user": return 1;
        case "guest": return 0;
    }
}

function TokenToBits( token )
{
    switch( token )
    {
        case "superadmin": return 128;
        case "senioradmin": return 64;        
        case "fulladmin": return 32;        
        case "admin": return 16;
        case "mod": return 8;        
        case "reg": return 2;
        case "user": return 1;
        case "guest": return 0;
    }
}