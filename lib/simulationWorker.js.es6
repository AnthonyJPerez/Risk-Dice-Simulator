
importScripts('logger.js');
importScripts('../dependencies/rx.all.js');

var id = -1;

// REMOVE THESE
const initialAttackerArmies = 10; // REMOVE THIS
const initialDefenderArmies = 8; // REMOVE THIS

class Ruleset
{
	constructor()
	{

	}

	setNumDice()
	{

	}

	setNumDieFaces()
	{

	}
}

class Player
{
	constructor()
	{

	}
}

class Statistics
{
	constructor()
	{
		this.attackerWon = false;
		this.attackerArmiesPercentRemaining = 0.0;
		this.defenderArmiesPercentRemaining = 0.0;
	}

	getAttackerWon()
	{
		return this.attackerWon;
	}

	setAttackerWon(attackerWon)
	{
		this.attackerWon = attackerWon;
	}

	setAttackerArmiesPercentRemaining(armiesPercentRemaining)
	{
		this.attackerArmiesPercentRemaining = armiesPercentRemaining;
	}

	getAttackerArmiesPercentRemaining()
	{
		return this.attackerArmiesPercentRemaining;
	}

	setDefenderArmiesPercentRemaining(armiesPercentRemaining)
	{
		this.defenderArmiesPercentRemaining = armiesPercentRemaining;
	}

	getDefenderArmiesPercentRemaining()
	{
		return this.defenderArmiesPercentRemaining;
	}
}

class RiskSimulation
{
	constructor()
	{

	}

	run(attacker, defender)
	{
		return new Statistics();
	}
}


function runSimulations(parameters)
{	
	var simulationResults = {};

	var attackerRules = new Ruleset();
	attackerRules.setNumDice(3); // Attack using three die
	attackerRules.setNumDieFaces(6); // Each die is a 6-sided die
	
	var defenderRules = new Ruleset();
	defenderRules.setNumDice(2); // Defend using two die
	defenderRules.setNumDieFaces(6); // Each die is a 6-sided die
	
	var attacker = new Player(attackerRules, initialAttackerArmies, 3);
	var defender = new Player(defenderRules, initialDefenderArmies, 0);
	var simulation = new RiskSimulation();
	
	// Run the simulations. The .publish() at the end makes this a
	// ConnectableObservable, meaning that it won't begin emitting
	// anything until all of the subscribers are setup and we explicitly
	// call .connect(). If we don't do this, each subscriber will cause
	// this Observable to emit items, and the next subscription will
	// cause a whole new set of items being emitted, instead of
	// each subscriber getting handed the same emitted items.
	var simulationOutcomes = Rx.Observable
		.range(1, parameters.numSimulations)
		.map(() => simulation.run(attacker, defender))
		.publish();

	// Calculate the average number of times the Simulations returned with a win.
	// A "win" in a Risk battle is when the attacker successfully take the
	// defender's country (defender reaches 0 armies).
	//
	// This Observable first takes each SimulationResult output by
	// the `simulationOutcomes` observable and maps them into a 1
	// if the attacker took the country, and a 0 otherwise. Once all
	// SimulationResults are mapped, they are fed into the .averageDouble()
	// Observable, which sums all of the numbers in the stream and
	// returns the average of those numbers.
	var averageWins = simulationOutcomes
	    .map(stat => stat.getAttackerWon() ? 1.0 : 0.0)
	    .average();

	// Subscribe to our averageWins stream and print out the result.
	averageWins.subscribe(
		winAverage => _Log("Avg attacker wins: %d (%d wins)", 
		    (winAverage * 100), (winAverage * parameters.numSimulations)));

	// Determine the average number of units that remain after successfully
	// taking a country. 
	//
	// This Observable first takes each SimulationResult output by
	// the `simulationOutcomes` observable, and filters to select only
	// those results where the attacker won. Then, the filtered results
	// are converted into a percentage representing the amount of armies
	// the attacker had left over. These percents are then averaged
	// and that average returned.
	var avgAttackerArmiesRemaining = simulationOutcomes
		.filter(stat => stat.getAttackerWon())
		.map(stat => stat.getAttackerArmiesPercentRemaining())
		.average()
		.subscribe(x => _Log("avgAttackerArmiesRemaining: %O", x));

	// Subscribe to the average attacker armies remaining observable, and 
	// print out the result.
	//avgAttackerArmiesRemaining
	//    .subscribe(armiesRemaining => _Log("Avg attacker armies remaining on wins: %d (%d armies)",
	//		(100 * armiesRemaining), (armiesRemaining * initialAttackerArmies)));
	
	/*
	// Determine the average number of units that remain after failing to
	// take over a country. I use a similar method of calculation here as
	// I did for the average attacker's armies.
	var averageDefenderArmyLoss = simulationOutcomes
		.filter(stat => !stat.getAttackerWon())
		.map(stat => stat.getDefenderArmiesPercentRemaining())
		.average();

	// Subscribe to the average defender armies remaining observable, and 
	// print out the result.
	averageDefenderArmyLoss.subscribe(
		armiesRemaining => _Log("Avg defender armies remaining on losses: %d (%d armies)",
			(100 * armiesRemaining), (armiesRemaining * initialDefenderArmies)));*/

	// Now that all of our subscribers are setup, start emitting the results of 
	// the simulations.
	_Log("Running %d Simulations...", parameters.numSimulations);
	simulationOutcomes.connect();
	_Log("Finished running the simulations.");

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
			_Log("[Worker %s] Running %s simulations...", id, numSimulations);
			var results = runSimulations(parameters);
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