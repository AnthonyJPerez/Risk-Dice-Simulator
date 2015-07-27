var dom_loaded = new $.Deferred();

// Register the main routine to fire when our
// dependencies have loaded:
$.when(dom_loaded).then(main);


function convertFormToJson(form)
{
	var json = {};
    
    jQuery.each(form, function() {
        json[this.name] = this.value || '';
    });
    
    return json;
}


function runSimulation()
{
	console.log("Running the simulation");

	// Grab the form parameters
	var formArray = $("#simulationForm").serializeArray();
	var json = convertFormToJson(formArray);
	console.log("form JSON:", json);

	chrome.runtime.sendMessage(json);

	// Don't reset the form.
	return false;
}


function main()
{
	console.log("Main started.");

	// Setup the onclick handler for our simulate button
	$("#simulate").click(runSimulation);
}


$(document).ready(function(){
	dom_loaded.resolve();
});