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
	* Sets the value of a field of a DB object.
	* @param {*} key
	* @param {*} field
	* @param {*} value
	*/
async function setDbObjectField(key, field, value) {
	return new Promise((resolve, reject) => {
		Db.setObjectField(key, field, value, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

/**
	* Gets the value of a field of a DB object.
	* @param {*} key
	* @param {*} field
	*/
async function getDbObjectField(key, field) {
	return new Promise((resolve, reject) => {
		Db.getObjectField(key, field, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

/**
	* 
	* @param {*} key 
	* @param {*} field 
	*/
async function removeDbObjectField(key, field) {
	return new Promise((resolve, reject) => {
		Db.deleteObjectField(key, field, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
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
		User.create({
			username: user.username,
			email: user.email,
		}, (err, uid) => {
			if (err) {
				return reject(err);
			}
			return resolve(uid);
		});
	});

	const oidchash = hash(user.oidcIssuer, user.oidcSubject);

	await User.setUserField(uid, 'oidcissuer', user.oidcIssuer); // for display
	await User.setUserField(uid, 'oidcsubject', user.oidcSubject); // for display

	// Saving
	await setDbObjectField('oidc:uid', oidchash, uid);

	return uid;
}

/**
	* Merges the OIDC informations to an existing user
	* @param {string} uid
	* @param {Object} oidc
	* @param {string} oidc.oidcIssuer issuer
 * @param {string} oidc.oidcSubject subject
	*/
async function merge(uid, oidc) {
	const oidchash = hash(oidc.oidcIssuer, oidc.oidcSubject);

	await User.setUserField(uid, 'oidcissuer', oidc.oidcIssuer);
	await User.setUserField(uid, 'oidcsubject', oidc.oidcSubject);
	await setDbObjectField('oidc:uid', oidchash, uid);
}

/**
	* Removes oidc information for user
	* @param {*} uid
	*/
async function remove(uid) {
	const oidchash = hash(
		await User.getUserField(uid, 'oidcissuer'),
		await User.getUserField(uid, 'oidcsubject')
	);
	await removeDbObjectField('oidc:uid', oidchash);
}

/**
 * Searches for an user id by its issuer and subject.
 * @param {string} issuer
 * @param {string} subject
 */
async function getUidByIssuerAndSubject(issuer, subject) {
	return getDbObjectField('oidc:uid', hash(issuer, subject));
}

/**
	* Check if an user with the given uid exists.
	* @param {*} uid
	*/
async function exists(uid) {
	return User.exists(uid);
}

/**
 * Searches for an user id by its email.
	* @param {string} email
	*/
async function getUidByEmail(email) {
	return User.getUidByEmail(email.toLocaleLowerCase());
}

module.exports = {
	create,
	merge,
	exists,
	remove,
	getUidByIssuerAndSubject,
	getUidByEmail,
};
