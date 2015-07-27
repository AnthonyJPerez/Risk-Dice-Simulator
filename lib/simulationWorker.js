

self.addEventListener('message', function(message)
{
	var command = message.data;
	console.log("[simulationWorker] Received msg: ", command);

	switch (command.command)
	{
		case "simulate":
			// Send the message back
			var parameters = command.parameters;
			console.log("received parameters: ", parameters);
			self.postMessage("ack");
			break;
	}	
}, false);