
module.exports = 
{
    msToTime: function(ms)
    {
        var seconds = Math.floor(ms)
        var minutes = Math.floor(ms/(1000*60))
        var hours = Math.floor(ms/(1000*60*60))
        var days = Math.floor(ms/(1000*60*60*24))

        hours = days?hours%24:hours
        minutes = days?0:(hours?minutes%60:minutes)
        seconds = days?0:(hours?0:(minutes?seconds%60:seconds))

        Time = `${days?(days==1?days+' Day ':days+' Days '):''}${hours?(hours==1?hours+' Hour ':hours+' Hours '):''}${minutes?(minutes==1?minutes+' min ':minutes+' mins '):''}${seconds?(seconds==1?seconds+' sec ':seconds+' secs '):''}`

        return Time
    }
}