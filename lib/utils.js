var	path = require('path')
	fs = require('fs');

/**
 * Creates a file with a unique filename, with access permission set to 0666, in the specified directory
 *
 * @see http://linux.die.net/man/3/tempnam
 * @param {String} dir The directory to create the file in
 * @param {String} prefix The file prefix
 * @return {String}
 */
module.exports.tempnam = function(dir, prefix) {
	var name = null;
	do {
		name = prefix + (Math.random() * 0x100000000 + 1).toString(36);
		name = path.join(dir, name);
		if (!fs.existsSync(name)) {
			if (!fs.openSync(name, 'w')) {
				return false;
			}
			break;
		}
	} while(true);
	return name;
}