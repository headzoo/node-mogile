var testCase = require('nodeunit').testCase;
var tracker = require('../tracker');

module.exports = testCase({
	testHostAndPort: function(test) {
		var t = tracker.factory('localhost:8000');
		test.equal(t.getHost(), 'localhost');
		test.equal(t.getPort(), 8000);
		test.done();
	},
	testDefaultPort: function(test) {
		var t = tracker.factory('localhost');
		test.equal(t.getPort(), 7001);
		test.done();
	},
	testAlive: function(test) {
		var t = tracker.factory('localhost');
		test.ok(t.isAlive());
		test.done();
	},
	testDead: function(test) {
		var t = tracker.factory('localhost');
		t.setDead();
		test.ok(!t.isAlive());
		test.done();
	}
});