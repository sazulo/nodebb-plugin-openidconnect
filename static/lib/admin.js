'use strict';

/* globals $, app, socket, define */

define('admin/oidc', ['settings'], function (Settings) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('oidc', $('.oidc-settings'));

		$('#save').on('click', function () {
			Settings.save('oidc', $('.oidc-settings'), function () {
				app.alert({
					type: 'success',
					alert_id: 'oidc-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});
	};

	return ACP;
});
