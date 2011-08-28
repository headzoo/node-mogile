node-mogile - a node.js MogileFS client
===========================

This is a simple MogileFS client for node.js. This is our first real project using
node.js, so it may be buggy, inefficient, and just plain useless. It was written to
serve our needs, and it does.

## Usage

	var mogile = require('mogile');
	
	// Create an array of trackers to communicate with
	var trackers = ['mogtracker1.server.net:7001', 'mogtracker2.server.net:7001'];
	var mog = mogile.factory(trackers);
	
	// Most commands use the domain object
	var domain = mog.domain('default');
	
	// Get all the paths for a given file
	domain.getPaths('my_file.txt', 0, function(err, paths) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
		if (paths.length == 0) {
			console.log('No paths found for key');
			return;
		}
		
		for(var i = 0; i < paths.length; i++) {
			console.log(paths[i]);
		}
	});
	
	// Getting the contents of a file, and storing it locally in /tmp/my_file.txt
	domain.getFile('my_file.txt', '/tmp/my_file.txt', function(err, bytes_written) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log('Wrote ' + bytes_written + ' bytes');
	});
	
	// Storing the file /tmp/my_file.txt in mogile using the key 'my_file.txt' in
	// the 'default' storage class.
	domain.storeFile('my_file.txt', 'default', '/tmp/my_file.txt', function(err, bytes_written) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log('Wrote ' + bytes_written + ' bytes');
	});
	
