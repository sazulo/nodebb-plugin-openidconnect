'use strict';

const meta = require.main.require('./src/meta');

/**
 * Retrieves a value in the settings by its hash
 * @param {string} hash
 */
async function get(hash) {
	return new Promise((resolve, reject) => {
		meta.settings.get(hash, (err, settings) => {
			if (err) {
				reject(err);
			} else {
				resolve(settings);
			}
		});
	});
}


module.exports = {
	get,
};
