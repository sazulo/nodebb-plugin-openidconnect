<form role="form" class="oidc-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">General</div>
		<div class="col-sm-10 col-xs-12">
			<div class="form-group">
				<label for="discoverUrl">Discover URL</label>
				<input type="text" id="discoverUrl" name="discoverUrl" title="Discover URL" class="form-control" placeholder="https://myauthserver/.well-known/openid-configuration">
			</div>
			<div class="form-group">
				<label for="clientId">Client ID</label>
				<input type="text" id="clientId" name="clientId" title="Client ID" class="form-control" placeholder="id">
			</div>
            <div class="form-group">
                <label for="clientSecret">Client Secret</label>
                <input type="text" id="clientSecret" name="clientSecret" title="Client Secret" class="form-control" placeholder="secret">
            </div>
		</div>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
