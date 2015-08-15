
importScripts('logger.js');
importScripts('../dependencies/rx.all.js');

var id_ = -1;

// REMOVE THESE
const initialAttackerArmies = 10; // REMOVE THIS
const initialDefenderArmies = 8; // REMOVE THIS


// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
		this.attackerWon = (getRandomInt(0, 1)) ? true : false; // false;
		this.attackerArmiesPercentRemaining = Math.random(); //0.0;
		this.defenderArmiesPercentRemaining = Math.random(); //0.0;
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
	var resolveWinsAreCalculated, winsAreCalculated = new Promise(
		function(resolve, reject){
			resolveWinsAreCalculated = resolve;
		});
	var resolveAttackerArmiesAreCalculated, attackerArmiesAreCalculated = new Promise(
		function(resolve, reject){
			resolveAttackerArmiesAreCalculated = resolve;
		});
	var resolveDefenderArmiesAreCalculated, defenderArmiesAreCalculated = new Promise(
		function(resolve, reject){
			resolveDefenderArmiesAreCalculated = resolve;
		});
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
	// A "win" in a Risk battle is when the attacker successfully takes the
	// defender's country (defender reaches 0 armies).
	//
	// This Observable first takes each SimulationResult output by
	// the `simulationOutcomes` observable and maps them into a 1
	// if the attacker took the country, and a 0 otherwise. Once all
	// SimulationResults are mapped, they are fed through the .average()
	// Observable, which sums all of the numbers in the stream and
	// returns the average of those numbers.
	var averageWins = simulationOutcomes
	    .average(stat => stat.getAttackerWon() ? 1.0 : 0.0)
		.subscribe(
			winAverage => {
				var percent = 100 * winAverage;
				var num = winAverage * parameters.numSimulations;
				_Log("[%s] Avg attacker wins: %f%% (%d wins)",
	        		id_, percent, num);
				self.postMessage({id: id_, message:"avgWins", "percent":percent, wins:num});
			},
			() => { // onError
				self.postMessage({id: id_, message:"avgWins", "percent":0.0, wins:0});
			},
			() => { // onComplete
				resolveWinsAreCalculated();
			});

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
		.average(stat => stat.getAttackerArmiesPercentRemaining())
		.subscribe(
			armiesRemaining => {
				var percent = 100 * armiesRemaining;
				var num = armiesRemaining * initialAttackerArmies;
				_Log("[%s] Avg attacker armies remaining on wins: %f%% (%d armies)",
	        		id_, percent, num);
				self.postMessage({id: id_, message:"avgAttackerArmies", "percent":percent, armies:num});
			},
			() => { // onError
				self.postMessage({id: id_, message:"avgAttackerRemaining", percent:0.0, armies:0});
			}, 
			() => { // onComplete
				resolveAttackerArmiesAreCalculated();
			});
	
	// Determine the average number of units that remain after failing to
	// take over a country. I use a similar method of calculation here as
	// I did for the average attacker's armies.
	var averageDefenderArmyLoss = simulationOutcomes
		.filter(stat => !stat.getAttackerWon())
		.average(stat => stat.getDefenderArmiesPercentRemaining())
		.subscribe(
			armiesRemaining => {
				var percent = 100 * armiesRemaining;
				var num = armiesRemaining * initialDefenderArmies;
				_Log("[%s] Avg attacker armies remaining on losses: %f%% (%d armies)",
	        		id_, percent, num);
				self.postMessage({id: id_, message:"avgDefenderRemaining", "percent":percent, armies:num});
			},
			() => { // onError
				self.postMessage({id: id_, message:"avgDefenderRemaining", percent:0.0, armies:0});
			},
			() => { // onComplete
				resolveDefenderArmiesAreCalculated();
			});

	// Now that all of our subscribers are setup, start emitting the results of 
	// the simulations.
	_Log("[%s] Running %d Simulations...", id_, parameters.numSimulations);

	// Begin running the simulations and emitting results
	simulationOutcomes.connect();

	return Promise.all([
		winsAreCalculated, 
		attackerArmiesAreCalculated, 
		defenderArmiesAreCalculated
	]);
}


function messageHandler (message)
{
	_Instrument("[Worker] messageHandler");
	var command = message.data;

	switch (command.command)
	{
		case "setId":
			_Log("Setting ID to %s", command.id);
			id_ = command.id;
			break;

		case "simulate":
			// Send the message back
			var parameters = command.parameters;
			var numSimulations = parameters.numSimulations;
			_Log("[%s] Running %s simulations...", id_, numSimulations);
			runSimulations(parameters).then(() => {
				_Log("[%s] Finished running the simulations.", id_);
				self.postMessage({id: id_, message:"finished"});
			});
			break;
	}
	_InstrumentEnd();	
}


function init()
{
	self.addEventListener('message', messageHandler, false);
}


init();