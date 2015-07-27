

self.addEventListener('message', function(message)
{
	var parameters = message.data;
	console.log("[simulationWorker] Received msg: ", parameters);
	// Send the message back
	self.postMessage("ack");

	// Note: In this function we will actually receive commands
	// that we will listen for here, to determine when we should
	// be terminating versus executing a simulation.
}, false);