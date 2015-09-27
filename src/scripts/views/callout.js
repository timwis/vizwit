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
		
		// Save options to view
		options = options || {};
		this.vent = options.vent || null;
		this.filteredCollection = options.filteredCollection || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, this.collection.dataset + '.filter', this.onFilter);
		
		// Collection should only fetch one result
		this.collection.limit = 1;
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		this.listenTo(this.filteredCollection, 'sync', this.render);
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		this.listenTo(this.filteredCollection, 'request', LoaderOn);
		this.listenTo(this.filteredCollection, 'sync', LoaderOff);
		
		this.collection.fetch();
	},
	render: function() {
		var model = this.collection.at(0);
		var data = {
			config: this.config,
			value: model ? model.get('value') : 0
		};
		if(this.filteredCollection.getFilters().length) {
			data.filteredValue = this.filteredCollection.length ? this.filteredCollection.at(0).get('value') : 0;
		}
		this.$('.viz').empty().append(Template(data));
	},
	// When another chart is filtered, filter this collection
	onFilter: function(data) {
		this.filteredCollection.setFilter(data);
		this.filteredCollection.fetch();
		this.renderFilters();
	}
});