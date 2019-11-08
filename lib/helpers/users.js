'use strict';

const crypto = require('crypto');

const User = require.main.require('./src/user');
const Db = require.main.require('./src/database');

/**
 * Simple function to create a hash from an issuer and subject.
 * Used to facilitate search in the database
 * @private
 * @param {*} issuer
 * @param {*} subject
 */
function hash(issuer, subject) {
	return crypto.createHash('md5').update(`${issuer}-${subject}`).digest('hex');
}

/**
 * Creates a new user, returning its id
 * @param {Object} user
 * @param {string} user.username
 * @param {string} user.email
 * @param {string} user.oidcIssuer
 * @param {string} user.oidcSubject
 */
async function create(user) {
	const uid = await new Promise((resolve, reject) => {
		User.create({ username: user.username }, (err, uid) => {
			if (err) {
				return reject(err);
			}
			return resolve(uid);
		});
	});

	const oidchash = hash(user.oidcIssuer, user.oidcSubject);

	await User.setUserField(uid, 'email', user.email);
	await User.setUserField(uid, 'oidcissuer', user.oidcIssuer); // for display
	await User.setUserField(uid, 'oidcsubject', user.oidcSubject); // for display

	// Saving
	await new Promise((resolve, reject) => {
		Db.setObjectField('oidc:uid', oidchash, uid, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});


	return uid;
}

/**
 * Searches for an user id by its issuer and subject.
 * @param {string} issuer
 * @param {string} subject
 */
async function getUidByIssuerAndSubject(issuer, subject) {
	return new Promise((resolve, reject) => {
		Db.getObjectField('oidc:uid', hash(issuer, subject), (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

module.exports = {
	create,
	getUidByIssuerAndSubject,
};
