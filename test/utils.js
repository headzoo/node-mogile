var testCase = require('nodeunit').testCase;
var utils = require('../lib/utils');
var path = require('path');

module.exports = testCase({
	testTempnam: function(test) {
		var file_name = utils.tempnam('/tmp', 'foo');
		fs.exists(file_name, function(exists) {
			test.ok(exists);
			test.done();
		});
	}
});