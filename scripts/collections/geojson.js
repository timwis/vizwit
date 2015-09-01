var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
	
module.exports = Backbone.Collection.extend({
	initialize: function(models, options) {
		options = options || {};
		this.url = options.url || this.url || null;
	},
	parse: function(response, options) {
		return response.features;
	}
});