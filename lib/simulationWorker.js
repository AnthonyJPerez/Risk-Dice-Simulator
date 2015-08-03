
importScripts('logger.js');

var id = -1;


function messageHandler (message)
{
	_Instrument("[Worker] messageHandler", message);
	var command = message.data;
	_Log("[simulationWorker] Received msg: %O", command);

	switch (command.command)
	{
		case "setId":
			_Log("Setting ID to %s", id);
			id = command.id;
			break;

		case "simulate":
			// Send the message back
			var parameters = command.parameters;
			_Log("received parameters: %O", parameters);
			self.postMessage({id: id, message:"ack"});
			break;
	}
	_InstrumentEnd();	
}


function init()
{
	self.addEventListener('message', messageHandler, false);
}


init();