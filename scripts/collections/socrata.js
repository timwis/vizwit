var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var soda = require('soda-js');
var SocrataFields = require('./socrata-fields');

var model = Backbone.Model.extend({
	idAttribute: 'label'
});

var enclose = function(val) {
  return typeof val === 'string' ? '\'' + val + '\'' : val;
};
	
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
		this.filters = options.filters || {};
		this.order = options.order || null;
		this.limit = options.limit || this.limit;
		
		this.fields = new SocrataFields(options);
		this.countModel = new Backbone.Model();
	},
	url: function(count) {
		var filters = this.getFilters();
		var query = this.consumer.query()
			.withDataset(this.dataset);
		
		// Filters
		if(filters) {
			query.where(filters);
		}
		if(this.q) { query.q(this.q); }
		
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
		var filters = this.filters;
		
		// If dontFilterSelf enabled, remove the filter this collection's triggerField
		if( ! _.isEmpty(filters) && this.dontFilterSelf) {
			filters = _.omit(filters, this.triggerField);
		}
		
		// Parse expressions into basic SQL strings
		var expressions = _.pluck(filters, 'expression');
		expressions = expressions.map(function(expression) {
			return self.parseExpression(expression);
		});
		
		return expressions.join(' and ');
	},
	parseExpression: function(expression) {
		if(expression['type'] === 'and' || expression['type'] === 'or') {
			return [
				this.parseExpression(expression.left),
				expression.type,
				this.parseExpression(expression.right)
			].join(' ');
		} else {
			return [
				expression.left,
				expression.type,
				enclose(expression.right)
			].join(' ');
		}
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