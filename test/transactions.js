var testCase = require('nodeunit').testCase;
var mogile = require('../index');

module.exports = testCase({
	setUp: function(callback) {
		this.trackers = ['mogtracker1:7001'];
		this.client = mogile.createClient(this.trackers);
		this.domain = this.client.domain('default');
		callback();
	},
	testStoreFile: function(test) {
		var $this = this;
		$this.client.begin();
		$this.domain.storeFile('transaction-AAA.jpg', 'dropbox', '/tmp/AAAAAAA.jpg', function(err, bytes_written) {
			if (err) {
				test.ok(false, 'storeFile: ' + err);
			} else {
				test.ok(bytes_written > 0);
			}
			
			// We're going to introduce some delays between operations. At times Mogile can
			// be slow at commiting the actions on it's end. Because of this, this test may
			// have to be run a couple times to pass all tests.
			setTimeout(function() {
				$this.domain.getPaths('transaction-AAA.jpg', 0, function(err, paths) {
					if (err) {
						test.ok(false, 'First getPaths: ' + err);
					} else {
						test.ok(paths.length > 0);
					}
					
					setTimeout(function() {
						$this.client.rollback();
						
						setTimeout(function() {
							$this.domain.getPaths('transaction-AAA.jpg', 0, function(err, paths) {
								if (err) {
									if (err.indexOf('unknown_key') != -1) {
										test.ok(true);
									} else {
										test.ok(false, 'Second getPaths: ' + err);
									}
								} else {
									test.ok(paths.length == 0, 'There should not be any paths');
								}
								test.done();
							});
						}, 2000);
					}, 2000);
				});
			}, 2000);
		});
	},
	testDeleteFile: function(test) {
		var $this = this;
		
		$this.domain.storeFile('transaction-AAA.jpg', 'dropbox', '/tmp/AAAAAAA.jpg', function(err, bytes_written) {
			if (err) {
				test.ok(false, 'storeFile: ' + err);
			} else {
				test.ok(bytes_written > 0);
			}
			
			$this.client.begin();
			
			// We're going to introduce some delays between operations. At times Mogile can
			// be slow at commiting the actions on it's end. Because of this, this test may
			// have to be run a couple times to pass all tests.
			setTimeout(function() {
				$this.domain.del('transaction-AAA.jpg', 'dropbox', function(err) {
					if (err) {
						test.ok(false, 'dell: ' + err);
					} else {
						test.ok(true);
					}
					
					setTimeout(function() {
						$this.domain.getPaths('transaction-AAA.jpg', 0, function(err, paths) {
							if (err) {
								if (err.indexOf('unknown_key') != -1) {
									test.ok(true);
								} else {
									test.ok(false, 'First getPaths: ' + err);
								}
							} else {
								test.ok(paths.length == 0, 'There should not be any paths');
							}
							
							setTimeout(function() {
								$this.client.rollback();
								setTimeout(function() {
									$this.domain.getPaths('transaction-AAA.jpg', 0, function(err, paths) {
										if (err) {
											test.ok(false, 'Second getPaths: ' + err);
										} else {
											test.ok(paths.length > 0);
										}
										
										$this.domain.del('transaction-AAA.jpg');
										test.done();
									});
								}, 2000);
							}, 2000);
						});
					
					}, 2000);
				});
			}, 2000);
		});
	}
});