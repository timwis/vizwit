var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var soda = require('soda-js');
var SocrataFields = require('./socrata-fields');

var model = Backbone.Model.extend({
	idAttribute: 'label'
});
	
module.exports = Backbone.Collection.extend({
	countProperty: 'count',
	limit: 5000,
	model: model,
	initialize: function(models, options) {
		// Save config to collection
		options = options || {};
		this.domain = options.domain || null;
		this.consumer = new soda.Consumer(this.domain);
		this.dataset = options.dataset || null;
		this.groupBy = options.groupBy || null;
		this.triggerField = options.triggerField || options.groupBy;
		this.filter = options.filter || {};
		this.order = options.order || null;
		this.limit = options.limit || this.limit;
		
		this.fields = new SocrataFields(options);
		this.countModel = new Backbone.Model();
	},
	url: function(count) {
		var filter = this.getFilters();
		var query = this.consumer.query()
			.withDataset(this.dataset);
		
		// Filters
		if(filter) {
			query.where(filter);
		}
		if(this.q) { query.q(this.q); console.log(this.q) }
		
		// Group by
		if(this.groupBy) {
			query.select('count(*), ' + this.groupBy + ' as label')
			.group(this.groupBy)
			.order(this.order || 'count desc');
		}
		
		// Count
		if(count) {
			query.select('count(*)');
		}
		// Non-count
		else {
			// Limit & offset
			if(this.limit) query.limit(this.limit);
			if(this.offset) query.offset(this.offset);
			
			// Group by already sets order
			if( ! this.groupBy) query.order(this.order || ':id');
		}
		return query.getURL();
	},
	getFilters: function() {
		var self = this;
		var filters = this.filter;
		if( ! _.isEmpty(filters) && this.dontFilterSelf) {
			filters = _.filter(filters, function(row) { return row.field !== self.triggerField; });
		}
		return _.pluck(filters, 'expression').join(' and ');
	},
	getCount: function() {
		var self = this;
		this.countModel.url = this.url(true);
		
		// If recordCount is already set, return it (as a deferred); otherwise fetch it
		return self.recordCount ? ($.Deferred()).resolve(self.recordCount) : this.countModel.fetch()
			.then(function(response) {
				self.recordCount = response.length ? response[0].count : 0;
				return self.recordCount;
			});
	}
})