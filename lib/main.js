


//// 
// Globals
////
var dom_loaded = new $.Deferred();

// Register the main routine to fire when our
// dependencies have loaded:
$.when(dom_loaded).then(main);


// Convert the arraybuffer (binary array) into a hex string:
// ex: [0xa1, 0x03, 0x4f] => "a1034f"
function ab2str(arrayBuffer) 
{
	var uintArray = new Uint8Array(arrayBuffer);
	_Instrument("ab2str", uintArray);
	hexData = String.fromCharCode.apply(null, uintArray);
	_InstrumentEnd("ab2str", {hexData: hexData});
	return hexData;
}


// Numbers are prepended with a '0' if they are single digits:
// ex: 3 => "03", 21 => "21"
function padWithZero(num)
{
	var numStr = "" + num;
	if (numStr.length < 2)
	{
		numStr = "0" + numStr;
	}
	return numStr;
}


// Returns the current datetime in the format:
// yyyy/mm/dd hh:mm:ss
// Ex: 2014/03/23 16:35:08
function getCurrentDate()
{
	var currentdate = new Date();
	var yyyy = currentdate.getFullYear();
	var mm = padWithZero(currentdate.getMonth() + 1);
	var dd = padWithZero(currentdate.getDate());
	var hour = padWithZero(currentdate.getHours());
	var min = padWithZero(currentdate.getMinutes());
	var sec = padWithZero(currentdate.getSeconds());
	var datetime = yyyy + "/" + mm + "/" + dd + " "
		+ hour + ":" + min + ":" + sec;
	return datetime;
}


////////////////////////////////////////////
////////////////////////////////////////////
//
// 	 			    Main
//
////////////////////////////////////////////
////////////////////////////////////////////


(function()
{    
	dom_loaded.resolve();
	console.info("DOM is ready");
})();


// Callback function used to handle messages received from the web worker.
// These messages should contain the results of a successful simulation.
function workerMessageHandler (message)
{
	_Instrument("workerMessageHandler");

	var result = message.data;
	console.log("Received from worker: ", result);

	_InstrumentEnd();
}


// Callback function to handle messages received from the popup. The
// popup will send simulation parameters submitted by the user.
function popupMessageHandler (message, sender, responder)
{
	_Instrument("popupMessageHandler");

	console.log("Received message from popup: ", message, sender, responder);
	var parameters = message;

	// Create a pool of webworkers
	var worker = new Worker("lib/simulationWorker.js");
	// ...

	// Create a new webworker to run the simulation, then send it
	// the parameters.
	var command = {"command":"simulate", "parameters":parameters};
	worker.addEventListener('message', workerMessageHandler, false);
	worker.postMessage(command);

	// Release the pool of webworkers, but not here! It will happen immediately
	// otherwise.
	//worker.terminate();
	// ...

	_InstrumentEnd();
}


function main()
{
	_Instrument("Main");
	console.debug("Starting...");

	// Listen to messages from the popup
	chrome.runtime.onMessage.addListener(popupMessageHandler);

	_InstrumentEnd();
}
