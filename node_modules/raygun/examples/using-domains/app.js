var config = require('config');

// Setup Raygun
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({apiKey: config.Raygun.Key});

// Create a domain
var appDomain = require('domain').create();

// Add the error handler so we can pass errors to Raygun when the domain
// crashes
appDomain.on('error', function (err) {
    try {
    	// Try send data to Raygun
        raygunClient.send(err, {}, function () {
        	// Exit the process once the error has been sent
            process.exit(1);
        });
    } catch (e) {
		// If there was an error sending to Raygun, log it out and end the process.
		// Could possibly log out to a text file here
		console.log(e);
        process.exit(1);
    }
});

// Run the domain
appDomain.run(function () {
	var fs = require('fs');

	// Try and read a file that doesn't exist
	fs.readFile('badfile.json', 'utf8', function(err, file){
		if(err) {
			// We could send the error straight to Raygun
			// raygunClient.send(err);

			// Or we can deal with it in our "Fake Error Handler" below
			
			// This will throw an error as fakeErrorHandler doesn't exist
			fakeErrorHandler.DealWith(err);
		}
	})
});