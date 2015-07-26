var dom_loaded = new $.Deferred();

// Register the main routine to fire when our
// dependencies have loaded:
$.when(dom_loaded).then(main);


function main()
{
	console.log("Main started.");
}


$(document).ready(function(){
	dom_loaded.resolve();
});