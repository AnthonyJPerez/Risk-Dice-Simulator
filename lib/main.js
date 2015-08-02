
const MAX_WORKERS = 10;
const TOTAL_SIMULATION_COUNT = 100;

//// 
// Globals
////
var dom_loaded = new $.Deferred();
var workerPool = [];

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

	console.log("Received from worker: ", message);

	_InstrumentEnd();
}


function initWorkerPool(msgHandlerCallback)
{
	_Instrument("initWorkerPool");
	// Add several workers into the worker pool
	for (var i=0; i<MAX_WORKERS; ++i)
	{
		console.log("Creating worker %s", i);
		var worker = new Worker("lib/simulationWorker.js");
		workerPool.push(worker);
		worker.addEventListener('message', msgHandlerCallback, false);
		worker.postMessage({"command":"setId", "id":i});
	}
	_InstrumentEnd();
}


function destroyWorkerPool()
{
	_Instrument("destroyWorkerPool");
	for (i in workerPool)
	{
		console.log("Terminating worker %s", i);
		workerPool[i].terminate();
	}
	_InstrumentEnd();
}


// Callback function to handle messages received from the popup. The
// popup will send simulation parameters submitted by the user.
function popupMessageHandler (parameters, sender, responder)
{
	_Instrument("popupMessageHandler");

	console.log("Received message from popup: ", parameters, sender, responder);
	var simulationsAreComplete = new $.Deferred();
	var command = {"command":"simulate", "parameters":parameters};
	var simulationsRemaining = TOTAL_SIMULATION_COUNT;

	// This will be the callback that will handle messages received
	// from the worker. It invokes the actual message handler callback,
	// and adds support for worker chaining and simulation completion.
	// This closure binds the simulationsAreComplete promise and the command
	// object.
	var workerMsgHandler = function(messageEvent)
	{
		_Instrument("messageEvent: ", messageEvent);
		workerMessageHandler(messageEvent.data);
		simulationsRemaining -= 1;
		console.log("Simulations Remaining: %s", simulationsRemaining);		
		if (simulationsRemaining <= 0)
		{
			console.log("Complete! Resolving the simulations promise...");
			simulationsAreComplete.resolve();
		}
		else
		{
			// There are still simulations to run, start this thread on another
			// simulation:
			console.log("Starting another simulation...");
			this.postMessage(command);
		}
		_InstrumentEnd();
	};

	initWorkerPool(workerMsgHandler);

	// Create a new webworker to run the simulation, then send it
	// the parameters.
	var i = 0;
	while (i < MAX_WORKERS && i < TOTAL_SIMULATION_COUNT)
	{
		workerPool[i].postMessage(command);
		i += 1;
	}

	// When the simulationComplete promise is fulfilled, trigger the
	// worker cleanup.
	$.when(simulationsAreComplete).then(destroyWorkerPool);
	_InstrumentEnd();
}


function main()
{
	_Instrument("Main");

	// Listen to messages from the popup
	chrome.runtime.onMessage.addListener(popupMessageHandler);

	_InstrumentEnd();
}
