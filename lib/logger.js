////////////////////////////////////////////
////////////////////////////////////////////
//
// 			  Logger Routines
//
////////////////////////////////////////////
////////////////////////////////////////////

var useLogging = true;

function _Log()
{
	return useLogging && console.log && Function.apply.call(console.log, console, arguments);
}


function _Instrument(funcName, params)
{
	if (!useLogging) return;
	if (params !== undefined)
	{
		console.group("%s - parameters: %O", funcName, params);
	} else {
		console.group(funcName);
	}
}


function _InstrumentEnd(funcName, params)
{
	if (!useLogging) return;
	if (params !== undefined)
	{
		console.log("[%s] Returning %O", funcName, params);
	}
	console.groupEnd("");
}