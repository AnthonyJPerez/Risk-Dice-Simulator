
importScripts('logger.js');
importScripts('../dependencies/rx.all.js');

var id = -1;


function runSimulation(parameters)
{	
	var simulationResults = {};

	var test = Rx.Observable
			.range(1, 10)
			.map(function(x){return "a";})
			.publish();

	test.subscribe(function(x){
		_Log("X: %O", x);
	});

	test.connect();
	return {message: "ack"};
}


function messageHandler (message)
{
	_Instrument("[Worker] messageHandler");
	var command = message.data;

	switch (command.command)
	{
		case "setId":
			_Log("Setting ID to %s", command.id);
			id = command.id;
			break;

		case "simulate":
			// Send the message back
			var parameters = command.parameters;
			var numSimulations = parameters.numSimulations;
			_Log("[Worker %s] Running %s simulations...", id, parameters.numSimulations);
			results = [];
			while (numSimulations > 0)
			{
				results.push(runSimulation(parameters));
				numSimulations -= 1;
			}
			_Log("[Worker %s] Generated %s results", id, results.length);
			self.postMessage({id: id, message:results.length});
			break;
	}
	_InstrumentEnd();	
}


function init()
{
	self.addEventListener('message', messageHandler, false);
}


init();