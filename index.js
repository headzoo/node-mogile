var	domain = require('./lib/domain'),
	tracker = require('./lib/tracker'),
	querystring = require('querystring'),
	net = require('net');

/**
 * Constructor
 *
 * @param {Array} trackers An array of mogile trackers
 * @param {Number} retries Number of times to retry an operation
 */
var Mogile = function(trackers, retries)
{
	this.trackers = [];
	for(var i = 0; i < trackers.length; i++) {
		this.trackers.push(new tracker.factory(trackers[i]));
	}
	this.current_tracker = null;
	this.retries = (typeof retries != 'undefined') ? retries : 1;
	this.encoding = 'ascii';
}

/**
 * Factory class
 *
 * Returns a new instance of Mogile.
 *
 * @param {Array} trackers An array of mogile trackers
 * @param {Number} retries Number of times to retry an operation
 * @return {Mogile}
 */
Mogile.createClient = function(trackers, retries)
{
	return new Mogile(trackers, retries);
}

/**
 * Domain factory method
 *
 * Returns a new instance of Domain.
 *
 * @return {Domain}
 */
Mogile.domain = Mogile.prototype.domain = function(name)
{
	return domain.factory(this, name);
}

/**
 * Gets a list of all the domains in the file system
 *
 * @param {Function} callback Function to call with an array of all domains
 * @return {Boolean}
 */
Mogile.prototype.getDomains = function(callback)
{
	callback = callback || function() {};
	
	this.send('default', 'GET_DOMAINS', {}, function(err, results) {
		if (err) {
			return callback(err);
		}
		
		var domains = [];
		for(var i = 1; i <= results['domains']; i++) {
			var dom = 'domain' + i;
			var classes = {};
			for(var j = 1; j <= results[dom + 'classes']; j++) {
				classes[results[dom + 'class' + j + 'name']] = results[dom + 'class' + j + 'mindevcount'] - 0;
			}
			domains.push({
				name: results[dom],
				classes: classes
			});
		}
		
		callback(null, domains);
	});
	
	return true;
}

/**
 * Sends a command to mogile
 *
 * @param {String} domain The storage domain
 * @param {String} cmd The command to send
 * @param {Object} args The command arguments
 * @param {Function} callback Function to call when the operation is complete
 * @return {Boolean}
 */
Mogile.prototype.send = function(domain, cmd, args, callback)
{
	args = args || {};
	callback = callback || function() {};
	
	args['domain'] = domain;
	var command = cmd + ' ' + querystring.stringify(args) + "\n";
	var tries = 0;
	var $this = this;
	console.log('mogile, sending command: ' + command);
	var sendf = function() {
		$this.sendCommand(command, function(err, results) {
			if (err) {
				tries++;
				if (tries > $this.retries) {
					// Mark the tracker dead
					return callback(err);
				} else {
					return sendf();
				}
			}
			
			// All responses should start with OK or ERR, followed by a space, and then some kind
			// of message. The message will be formatted as a URL query string, without any spaces.
			var parts = results.split(' ');
			
			// Having fewer than 2 parts is some kind of communications error, since the tracker
			// will always return 2 string separated by a space.
			if (parts.length != 2) {
				return callback('Got invalid response from tracker: ' + results);
			}
			
			// Responses starting with ERR are errors returned by the tracker. For instance
			// if the key is unknown.
			if (parts[0] == 'ERR') {
				return callback(parts[1]);
			}
			
			return callback(null, querystring.parse(parts[1].replace("\r\n", "")));
		});
	}
	
	sendf();
	return true;
}

Mogile.prototype.sendCommand = function(cmd, callback)
{
	var trackers = this.getLiveTrackers();
	if (trackers.length == 0) {
		callback('No live trackers found');
	}
	
	var i = 0;
	var $this = this;
	var sendf = function() {
		$this.current_tracker = trackers[i];
		var connection = net.createConnection($this.current_tracker.getPort(), $this.current_tracker.getHost());
		connection.setEncoding($this.encoding);
		connection.on('error', function(e) {
			i++;
			if (i == $this.trackers.length) {
				callback(err);
			} else {
				sendf();
			}
		});
		connection.on('connect', function() {
			connection.write(cmd, $this.encoding, function() {
				connection.on('data', function(response) {
					connection.end();
					callback(null, response);
				});
			});
		});
	}
	
	sendf();
	return true;
}

/**
 * Returns all the trackers in the alive state
 *
 * @return {Array}
 */
Mogile.prototype.getLiveTrackers = function()
{
	var live_trackers = [];
	for(var i = 0; i < this.trackers.length; i++) {
		if (this.trackers[i].isAlive()) {
			live_trackers.push(this.trackers[i]);
		}
	}
	return live_trackers;
}

// Export the Mogile class
module.exports = Mogile;