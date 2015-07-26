var timerHandle = null;
var port = null;


$(document).ready(function() {
    console.log("Script injected!");

    port = chrome.runtime.connect({name: "myContentScriptTest"});

    // Bind a listener for change events:
	$('.playerBarSong').bind("DOMSubtreeModified",function(){
	  // When this value is modified, it's because the player is changing songs.
	  // When this triggers, I want to set a timer for 5 seconds, that will reset
	  // if already set, and will prompt the script to scrape for the new song details
	  // when it expires. It will then send the song details to the main plugin over
	  // the comms port for storage.
	  console.log('changed');
	  
	  // Reset our timer, if it is set.
	  if (null != timerHandle)
	  {
	  	console.log("Resetting timer");
	  	window.clearTimeout(timerHandle);
	  	timerHandle = null;
	  }
	  
	  // Trigger our timer to start
	  console.log("Setting timer");
	  timerHandle = window.setTimeout(scrapeNewSong, 5000);
	});
});


function scrapeInfo(className)
{
	var obj = $(className);
	return {
		name: obj.html(),
		link: obj.attr("href")
	}
}


function scrapeNewSong()
{
	var songInfo = {};
	songInfo.song = scrapeInfo("a.playerBarSong");
	songInfo.artist = scrapeInfo("a.playerBarArtist");
	songInfo.album = scrapeInfo("a.playerBarAlbum");
	songInfo.isLiked = false;
	
	var songLiked = $(".thumbUpButton.indicator");
	if (songLiked.length > 0)
	{
		songInfo.isLiked = true;
	}
	
	console.log("Song Info: ", songInfo);
	timerHandler = null;
	
	// Send songInfo object back to our extension
	// for logging:
	port.postMessage(songInfo);
}