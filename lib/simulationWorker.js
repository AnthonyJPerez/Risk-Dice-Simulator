var id = -1;

function messageHandler (message)
{
	var command = message.data;
	console.log("[simulationWorker] Received msg: ", command);

	switch (command.command)
	{
		case "setId":
			console.log("Setting ID to %s", id);
			id = command.id;
			break;

		case "simulate":
			// Send the message back
			var parameters = command.parameters;
			console.log("received parameters: ", parameters);
			self.postMessage({id: id, message:"ack"});
			break;
	}	
}

self.addEventListener('message', messageHandler, false);