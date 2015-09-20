var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Panel = require('./panel');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
var Template = require('../templates/callout.html');
	
module.exports = Panel.extend({
	initialize: function(options) {
		Panel.prototype.initialize.apply(this, arguments);
		
		// Collection should only fetch one result
		this.collection.limit = 1;
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		
		this.collection.fetch();
	},
	render: function() {
		this.$('.viz').empty().append(Template({
			config: this.config,
			data: this.collection.at(0).toJSON()
		}));
	}
});