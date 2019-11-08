'use strict';

function renderAdminPage(req, res) {
	res.render('admin/oidc', {});
}


module.exports = {
	renderAdminPage,
};
