var testCase = require('nodeunit').testCase;
var mogile = require('../index');

module.exports = testCase({
	setUp: function(callback) {
		this.trackers = ['mogtracker1:7001'];
		this.client = mogile.createClient(this.trackers);
		this.domain = this.client.domain('default');
		callback();
	},
	testGetDomains: function(test) {
		this.client.getDomains(function(e, domains) {
			test.ok(domains.length > 0);
			test.done();
		});
	},
	testStoreFile: function(test) {
		this.domain.storeFile('AAAAAAA.jpg', 'dropbox', '/tmp/AAAAAAA.jpg', function(err, bytes_written) {
			if (err) {
				console.log(err);
				test.ok(false);
			} else {
				test.ok(bytes_written > 0);
			}
			test.done();
		});
	},
	testGetPaths: function(test) {
		this.domain.getPaths('AAAAAAA.jpg', 0, function(err, paths) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(paths.length > 0);
			}
			test.done();
		});
	},
	testGetFile: function(test) {
		this.domain.getFile('AAAAAAA.jpg', '/tmp/AAAAAAA.jpg', function(err, bytes) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(bytes > 0);
			}
			test.done();
		});
	},
	testRenameFile: function(test) {
		this.domain.rename('AAAAAAA.jpg', 'BBBBBBB.jpg', function(err) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(true);
			}
			test.done();
		});
	},
	testDeleteFile: function(test) {
		var $this = this;
		this.domain.del('BBBBBBB.jpg', function(err) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(true);
			}
			$this.domain.getPaths('BBBBBBB.jpg', 0, function(err, paths) {
				if (!err) {
					test.ok(false);
				} else if (err.indexOf(err, 'unknown_key') != -1) {
					test.ok(true);
				}
				test.done();
			});
		});
	}
});