
const WORKER_COUNT = 4;
const TOTAL_SIMULATION_COUNT = 10000;

//// 
// Globals
////
var dom_loaded = new $.Deferred();
var workerPool = [];

// Register the main routine to fire when our
// dependencies have loaded:
$.when(dom_loaded).then(main);


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

	_Log("Received from worker: %O", message);

	_InstrumentEnd();
}


function initWorkerPool(msgHandlerCallback)
{
	_Instrument("initWorkerPool");
	console.profile();
	// Add several workers into the worker pool
	for (var i=0; i<WORKER_COUNT; ++i)
	{
		_Log("Creating worker %s", i);
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
		_Log("Terminating worker %s", i);
		workerPool[i].terminate();
	}
	console.profileEnd();
	_InstrumentEnd();
}


// Callback function to handle messages received from the popup. The
// popup will send simulation parameters submitted by the user.
function popupMessageHandler (parameters, sender, responder)
{
	_Instrument("popupMessageHandler");
	_Log("Received message from popup -- parameters: %O, sender: %O, responder: %O", parameters, sender, responder);

	var simulationIsComplete = new $.Deferred();
	var numSimulationsPerThread = TOTAL_SIMULATION_COUNT / WORKER_COUNT;
	parameters.numSimulations = numSimulationsPerThread;
	var command = {"command":"simulate", "parameters":parameters};

	// This will be the callback that will handle messages received
	// from the worker. It invokes the actual message handler callback,
	// and adds support for worker chaining and simulation completion.
	// This closure binds the simulationIsComplete promise and the command
	// object.
	var threadsRemaining = WORKER_COUNT;
	var workerMsgHandler = function(messageEvent)
	{
		_Instrument("messageEvent: ", messageEvent);
		workerMessageHandler(messageEvent.data);
		threadsRemaining -= 1;

		if (threadsRemaining <= 0)
		{
			_Log("Complete! Resolving the simulations promise...");
			simulationIsComplete.resolve();
		}
		else
		{
			_Log("Still waiting for %s thread%s", threadsRemaining, (threadsRemaining>1)?"s":"");
		}
		_InstrumentEnd();
	};

	initWorkerPool(workerMsgHandler);

	// Create a new webworker to run the simulation, then send it
	// the parameters.
	var i = 0;
	while (i < WORKER_COUNT)
	{
		_Log("Sending msg %O", command);
		workerPool[i].postMessage(command);
		i += 1;
	}

	// When the simulationComplete promise is fulfilled, trigger the
	// worker cleanup.
	$.when(simulationIsComplete).then(destroyWorkerPool);
	_InstrumentEnd();
}


function main()
{
	_Instrument("Main");

	// Listen to messages from the popup
	chrome.runtime.onMessage.addListener(popupMessageHandler);

	_InstrumentEnd();
}
