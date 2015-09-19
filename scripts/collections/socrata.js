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
		
		this.countModel = new Backbone.Model();
	},
	url: function(count) {
		var self = this;
		var filters = this.getFilters();
		var query = this.consumer.query()
			.withDataset(this.dataset);
		
		// Filters
		if(filters.length) {
			// Parse filter expressions into basic SQL strings and concatenate
			filters = _.map(filters, function(filter) {
				return self.parseExpression(filter.field, filter.expression);
			}).join(' and ');
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
	setFilter: function(filter) {
		if(filter.expression) {
			this.filters[filter.field] = filter;
		} else {
			delete this.filters[filter.field];
		}
	},
	getFilters: function(key) {
		var filters = this.filters;
		
		if(key) {
			return filters[key];
		} else {
			// If dontFilterSelf enabled, remove the filter this collection's triggerField
			if( ! _.isEmpty(filters) && this.dontFilterSelf) {
				filters = _.omit(filters, this.triggerField);
			}
			
			return _.values(filters);
		}
	},
	parseExpression: function(field, expression) {
		if(expression['type'] === 'and' || expression['type'] === 'or') {
			return [
				this.parseExpression(field, expression.value[0]),
				expression.type,
				this.parseExpression(field, expression.value[1])
			].join(' ');
		} else if(expression['type'] === 'not in') {
			return [
				field,
				expression.type,
				'(',
				expression.value.map(enclose).join(', '),
				')'
			].join(' ');
		} else {
			return [
				field,
				expression.type,
				enclose(expression.value)
			].join(' ');
		}
	},
	getRecordCount: function() {
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