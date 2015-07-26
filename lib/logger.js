////////////////////////////////////////////
////////////////////////////////////////////
//
// 			  Logger Routines
//
////////////////////////////////////////////
////////////////////////////////////////////


function _Instrument(funcName, params)
{
	if (params !== undefined)
	{
		console.group("%s - parameters: %O", funcName, params);
	} else {
		console.group(funcName);
	}
}


function _InstrumentEnd(funcName, params)
{
	if (params !== undefined)
	{
		console.debug("[%s] Returning %O", funcName, params);
	}
	console.groupEnd("");
}