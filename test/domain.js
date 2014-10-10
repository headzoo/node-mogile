var testCase = require('nodeunit').testCase;
var mogile = require('../index');

module.exports = testCase({
	setUp: function(callback) {
		this.trackers = ['127.0.0.1:7001'];
		this.client = mogile.createClient(this.trackers);
		this.domain = this.client.domain('articles');
		callback();
	},
	testGetDomains: function(test) {
		this.client.getDomains(function(e, domains) {
            if (e){
                test.ok(false);
            }else {
                test.ok(domains.length > 0);
            }
			test.done();
		});
	},
	testStoreFile: function(test) {
		this.domain.storeFile('asdfdgahh', 'level1', '/home/bluehawky/mogileFs_note.txt', function(err, bytes_written) {
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
		this.domain.getPaths('asdfdgahh', 0, function(err, paths) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(paths.length > 0);
			}
			test.done();
		});
	},
	testGetFile: function(test) {
		this.domain.getFile('asdfdgahh', '/home/bluehawky/mogileFs_note_heh.txt', function(err, bytes) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(bytes > 0);
			}
			test.done();
		});
	},
	testRenameFile: function(test) {
		this.domain.rename('asdfdgahh', 'zzzzzzzz', function(err) {
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
		this.domain.del('zzzzzzzz', function(err) {
			if (err) {
				test.ok(false);
			} else {
				test.ok(true);
			}
			$this.domain.getPaths('zzzzzzzz', 0, function(err, paths) {
				if (!err) {
					test.ok(false);
				} else if (err.indexOf(err, 'unknown_key') != -1) {
					test.ok(true);
				}
				test.done();
			});
		});
	},
    testStoreData: function(test){
        this.domain.storeDataToMogile('adfghjklz;\'','level1','hhhhhhhh把这个东西存到mogilefs中level1去', function(err, bytes_written) {
            if (err) {
                console.log(err);
                test.ok(false);
            } else {
                test.ok(bytes_written > 0);
            }
            test.done();
        });
    }
    ,
    testGetData: function(test) {
        this.domain.getDataFromMogile('adfghjklz;\'',  function(err, msg) {
            if (err) {
                test.ok(false);
            } else {
                console.log(msg);
                test.ok(msg.length > 0);
            }
            test.done();
        });
    }
});