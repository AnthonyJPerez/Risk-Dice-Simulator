


//// 
// Globals
////
var dom_loaded = new $.Deferred();

// Register the main routine to fire when our
// dependencies have loaded:
$.when(dom_loaded).then(main);


// Convert the arraybuffer (binary array) into a hex string:
// ex: [0xa1, 0x03, 0x4f] => "a1034f"
function ab2str(arrayBuffer) 
{
	var uintArray = new Uint8Array(arrayBuffer);
	_Instrument("ab2str", uintArray);
	hexData = String.fromCharCode.apply(null, uintArray);
	_InstrumentEnd("ab2str", {hexData: hexData});
	return hexData;
}


// Numbers are prepended with a '0' if they are single digits:
// ex: 3 => "03", 21 => "21"
function padWithZero(num)
{
	var numStr = "" + num;
	if (numStr.length < 2)
	{
		numStr = "0" + numStr;
	}
	return numStr;
}


// Returns the current datetime in the format:
// yyyy/mm/dd hh:mm:ss
// Ex: 2014/03/23 16:35:08
function getCurrentDate()
{
	var currentdate = new Date();
	var yyyy = currentdate.getFullYear();
	var mm = padWithZero(currentdate.getMonth() + 1);
	var dd = padWithZero(currentdate.getDate());
	var hour = padWithZero(currentdate.getHours());
	var min = padWithZero(currentdate.getMinutes());
	var sec = padWithZero(currentdate.getSeconds());
	var datetime = yyyy + "/" + mm + "/" + dd + " "
		+ hour + ":" + min + ":" + sec;
	return datetime;
}


////////////////////////////////////////////
////////////////////////////////////////////
//
// 	 			    Main
//
////////////////////////////////////////////
////////////////////////////////////////////


(function()
{    
	dom_loaded.resolve();
	console.info("DOM is ready");
})();


function main()
{
	_Instrument("Main");
	console.debug("Starting...");

	// Setup a listener for our content script's communication port. Only
	// once this connection has been established will we begin blocking URLs:
	chrome.runtime.onConnect.addListener(function(port)
	{
		//console.log("port connection: ", port);

		// Setup our msg handler. This handler receives all messages
		// sent from the Content Script to the extension.
		port.onMessage.addListener(function(song) {
			console.log("received msg from content script: ", song);
		});
	});

	_InstrumentEnd();
}
