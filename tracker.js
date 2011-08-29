/**
 * Constructor
 *
 * @param {String} tracker A mogile tracker host[:port]
 */
var Tracker = function(tracker)
{
	this.host = '127.0.0.1';
	this.port = 7001;
	this.alive = true;
	
	var parts = tracker.split(':', 2);
	this.host = parts[0];
	if (parts.length == 2) this.port = (parts[1] - 0);
}

/**
 * Factory method
 *
 * Returns a new instance of Tracker.
 *
 * @param {String} tracker A mogile tracker host[:port]
 * @return {Tracker}
 */
Tracker.factory = function(tracker)
{
	return new Tracker(tracker);
}

/**
 * Returns the tracker host name
 *
 * @return {String}
 */
Tracker.prototype.getHost = function()
{
	return this.host;
}

/**
 * Returns the tracker port number
 *
 * @return {Number}
 */
Tracker.prototype.getPort = function()
{
	return this.port;
}

/**
 * Returns if the tracker is alive
 *
 * @return {Boolean}
 */
Tracker.prototype.isAlive = function()
{
	return this.alive;
}

/**
 * Sets the tracker as being alive
 *
 * @return {this}
 */
Tracker.prototype.setAlive = function()
{
	this.alive = true;
	return this;
}

/**
 * Sets the tracker as being dead
 *
 * @return {this}
 */
Tracker.prototype.setDead = function()
{
	this.alive = false;
	return this;
}

// Export Tracker class
module.exports = Tracker;