var testCase = require('nodeunit').testCase;
var mogile = require('../index');
require('headz');

module.exports = testCase({
	setUp: function(callback) {
		this.trackers = [];
		this.trackers.push('mogtracker1.int.hidsrv.net:7001');
		callback();
	},
	testGetDomains: function(test) {
		var m = mogile.factory(this.trackers);
		m.getDomains(function(e, domains) {
			test.ok(domains.length > 0);
			test.done();
		});
	},
	testGetPaths: function(test) {
		var m = mogile.factory(this.trackers);
		var d = m.domain('motherless');
		d.getPaths('AAAAAAA.jpg', 0, function(err, paths) {
			test.ok(paths.length > 0);
			test.done();
		});
	},
	testGetFile: function(test) {
		var m = mogile.factory(this.trackers);
		var d = m.domain('motherless');
		d.getFile('B019F32.flv', '/home/headz/site/temp/B019F32.flv', function(err, bytes) {
			test.ok(bytes > 0);
			test.done();
		});
	}
});
