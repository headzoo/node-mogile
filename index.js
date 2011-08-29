var	domain = require('./lib/domain'),
	tracker = require('./lib/tracker'),
	utils = require('./lib/utils'),
	querystring = require('querystring'),
	net = require('net'),
	fs = require('fs'),
	noop = function() {};

/**
 * Constructor
 *
 * @param {Array} trackers An array of mogile trackers
 * @param {Number} retries Number of times to retry an operation
 */
var Mogile = function(trackers, retries)
{
	// A log of all commands that took place during a transaction
	this.transaction_log = [];
	
	// Whether we're inside of a transaction or not
	this.is_transaction = false;
	
	// List of local files that need to be deleted at the end of of the transaction
	this.transaction_files = [];
	
	// The tracker hosts
	this.trackers = [];
	for(var i = 0; i < trackers.length; i++) {
		this.trackers.push(new tracker.factory(trackers[i]));
	}
	
	// The current tracker being used
	this.current_tracker = null;
	
	// The number of times to retry an operation
	this.retries = (typeof retries != 'undefined') ? retries : 1;
	
	// The default encoding for connections
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
 * Begins a mogile transaction
 */
Mogile.prototype.begin = function()
{
	if (this.is_transaction) {
		return false;
	}
	
	this.commit();
	this.is_transaction = true;
	return true;
}

/**
 * Commits all the changes in a transaction
 */
Mogile.prototype.commit = function()
{
	this.transactionCleanFiles();
	this.is_transaction = false;
	this.transaction_log = [];
	this.transaction_files = [];
	return true;
}

/**
 * Rolls back all the changes made during a transaction
 */
Mogile.prototype.rollback = function(callback)
{
	callback = callback || noop;
	
	// We have to stop the transaction now, or else subsequent calls
	// to send() will keep recording transaction logs.
	this.is_transaction = false;
	var logs = this.transaction_log.reverse();
	var action = null;
	var i = -1;
	var $this = this;
	
	var rollbackAction = function() {
		if (++i >= logs.length) {
			$this.commit();
			return callback();
		}
		
		action = logs[i];
		switch(action.cmd) {
			case 'DELETE':
					$this.domain(action.domain)
						.storeFile(action.args.key, action.args.class, action.args.temp_file, function(err, bytes) {
							if (err) {
								return callback(err);
							}
							return rollbackAction();
						});
				break;
			case 'RENAME':
					$this.domain(action.domain)
						.rename(action.args.to_key, action.args.from_key, function(err) {
							if (err) {
								return callback(err);
							}
							return rollbackAction();
						});
				break;
			case 'CREATE_CLOSE':
					$this.domain(action.domain)
						.del(action.args.key, action.args.class, function(err) {
							if (err) {
								return callback(err);
							}
							return rollbackAction();
						});
				break;
			default:
				// Not all commands have changes to make
				return rollbackAction();
				break;
		}
	};
	
	return rollbackAction();
}

/**
 * Deletes an temp files that were created during a transaction
 */
Mogile.prototype.transactionCleanFiles = function()
{
	for(var i = 0; i < this.transaction_files; i++) {
		fs.unlink(this.transaction_files[i]);
	}
}

/**
 * Gets a list of all the domains in the file system
 *
 * @param {Function} callback Function to call with an array of all domains
 * @return {Boolean}
 */
Mogile.prototype.getDomains = function(callback)
{
	callback = callback || noop;
	
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
	callback = callback || noop;
	args.domain = domain;
	var command = cmd + ' ' + querystring.stringify(args) + "\n";
	var tries = 0;
	var $this = this;
	
	var sendf = function() {
		$this.sendCommand(command, function(err, results) {
			if (err) {
				if (++tries > $this.retries) {
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
	
	if (this.is_transaction) {
		if (cmd == 'DELETE') {
			// When deleting, we need to store a temp copy of the file. That way
			// we can re-store the file if the transaction is rolled back. That's
			// why we *need* a storage class for the delete command when inside
			// transactions... There's no way to re-store the file without the name
			// of the storage class.
			if (typeof args.class == 'undefined') {
				return callback("A class name must be specified when deleting within a transaction");
			}
			args.temp_file = utils.tempnam('/tmp', 'mogile');
			if (!args.temp_file) {
				return callback('Unable to create temp file in /tmp');
			}
			$this.domain(args.domain)
				.getFile(args.key, args.temp_file, function(err, bytes) {
					if (err) {
						return callback(err);
					}
					$this.transaction_files.push(args.temp_file);
					$this.transaction_log.push({"domain": domain, "cmd": cmd, "args": args });
					sendf();
				});
		} else {
			$this.transaction_log.push({"domain": domain, "cmd": cmd, "args": args });
			sendf();
		}
	} else {
		sendf();
	}

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