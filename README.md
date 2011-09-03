mogile - A MogileFS client for node.js
===========================================

This is a simple MogileFS client for node.js. This is my first real project using
node.js, so it may be buggy, inefficient, and just plain useless. It was written to
serve my needs, and it does.

## Installation

	npm install mogile

## Usage

	var mogile = require('mogile');
	
	// The createClient method takes an array of trackers
	var trackers = ['mogtracker1.server.net:7001', 'mogtracker2.server.net:7001'];
	
	// Create a new mogile client
	var client = mogile.createClient(trackers);
	
	// Get all the domains
	client.getDomains(function(err, domains) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log(domains);
	});
	
	// All of the commands that work within a domain use a Domain object
	var domain = client.domain('default');
	
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
	
	// Deleting a file
	domain.del('my_file.txt', function(err) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
	});
	
	// Renaming a file
	domain.rename('my_file.txt', 'your_file.txt', function(err) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
	});

## Using Transactions

	var mogile = require('mogile');
	var trackers = ['mogtracker1.server.net:7001', 'mogtracker2.server.net:7001'];
	var client = mogile.createClient(trackers);
	
	client.begin(); // Start the transaction
	
	var domain = client.domain('default');
	domain.storeFile('my_file.txt', 'default', '/tmp/my_file.txt', function(err, bytes_written) {
		if (err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log('Wrote ' + bytes_written + ' bytes');
	});
	
	domain.rename('my_file.txt', 'your_file.txt', function(err) {
		if (err) {
			console.log('ERROR: ' + err);
			client.rollback(); // Rollback the changes
			return;
		}
	});
	
	domain.del('your_file.txt', 'default', function(err) {
		if (err) {
			console.log('ERROR: ' + err);
			client.rollback(); // Rollback the changes
			return;
		}
	});
	
	client.commit(); // Commit the changes
	
## TODO

* Try to use [sendfile](http://linux.die.net/man/2/sendfile) for getFile and storeFile


## License

(The MIT License)

Copyright (c) 2011 Sean Hickey <headz@headzoo.org>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.