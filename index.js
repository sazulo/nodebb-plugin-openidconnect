'use strict';

const passport = module.parent.require('passport');
const nconf = module.parent.require('nconf');
const winston = module.parent.require('winston');

const { Issuer, Strategy, custom } = require('openid-client');

const AUTH_OIDC_BASE_PATH = '/auth/oidc';
const AUTH_OIDC_LOGIN_PATH = `${AUTH_OIDC_BASE_PATH}/login`;
const AUTH_OIDC_CALLBACK_PATH = `${AUTH_OIDC_BASE_PATH}/callback`;
const CLOCK_TOLERANCE = 10;

const controllers = require('./lib/controllers');

const { UserHelper, SettingsHelper } = require('./lib/helpers');

/**
		* Initializes the plugin
		* @param {Object} data
		* @param {Function} callback
		*/
async function init({ router, middleware }, callback) {
	try {
		winston.info('Setting up OpenID Connect UI routes...');

		router.get('/admin/oidc', middleware.admin.buildHeader, controllers.renderAdminPage);
		router.get('/api/admin/oidc', controllers.renderAdminPage);

		callback();
	} catch (err) {
		callback(err);
	}
}

/**
		* Adds menu item in admin.
		* @param {Object} header
		* @param {Function} callback
		*/
async function addMenuItem(header, callback) {
	header.authentication.push({
		route: '/oidc',
		icon: 'fa-openid',
		name: 'OpenID Connect',
	});
	callback(null, header);
}

/**
		* Finds or Creates the logged user as needed.
		* @param {TokenSet} tokenSet
		* @param {Object} profile
		* @param {Function} callback
		*/
async function verify(tokenSet, profile, callback) {
	try {
		const claims = tokenSet.claims();
		let uid = await UserHelper.getUidByIssuerAndSubject(claims.iss, claims.sub);

		if (uid) {
			callback(null, { uid });
			return;
		}

		uid = await UserHelper.create({
			username: claims.preferred_username || claims.email,
			email: String(claims.email).toLowerCase(),
			oidcIssuer: claims.iss,
			oidcSubject: claims.sub,
		});

		callback(null, { uid });
	} catch (err) {
		callback(err);
	}
}

/**
		* Creates the Passport Strategy to login with OpenID Connect.
		*
		* @param {Array} strategies
		* @param {Function} callback
		*/
async function getStrategy(strategies, callback) {
	try {
		const config = await SettingsHelper.get('oidc');

		if (!config.discoverUrl || !config.clientId || !config.clientSecret) {
			winston.warn('[oidc] OpenID Connect configuration missing, disabling.');
			callback(null, strategies);
			return;
		}
		winston.verbose('[oidc] Fetching OpenID Connect Issuer informations ...');

		const issuer = await Issuer.discover(config.discoverUrl);

		winston.verbose('[oidc] Creating OpenID Connect Passport Strategy ...');

		const client = new issuer.Client({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			redirect_uris: [nconf.get('url') + AUTH_OIDC_CALLBACK_PATH],
		});

		// Adding some timestamp tolerance as they may be a little different
		// if nodebb and the OpenID Connect server are on two separate
		// hosts.
		client[custom.clock_tolerance] = CLOCK_TOLERANCE;

		const strategy = new Strategy({
			client,
			params: {
				// In OpenID Connect,
				// => issuer and subject in the 'openid' scope
				// => email in the 'email' scope
				// => username in the 'profile' scope ( as 'preferred_username' )
				// scope: 'openid email profile'
			},
		}, verify);

		passport.use(strategy.name, strategy);

		strategies.push({
			name: strategy.name,
			url: AUTH_OIDC_LOGIN_PATH,
			callbackURL: AUTH_OIDC_CALLBACK_PATH,
			icon: 'fa-openid',
			scope: 'openid email profile',
		});

		winston.verbose('[oidc] Strategy initialized ...');

		callback(null, strategies);
	} catch (err) {
		winston.error(err);
		callback(err);
	}
}

module.exports = {
	init,
	addMenuItem,
	getStrategy,
};
