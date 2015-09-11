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
		
		this.fields = new SocrataFields(options);
	},
	url: function() {
		var filter = _.pluck(this.filter, 'expression').join(' and ');
		var query = this.consumer.query()
			.withDataset(this.dataset);
		if(filter) {
			query.where(filter);
		}
		if(this.groupBy) {
			query.select('count(*), ' + this.groupBy + ' as label')
			.group(this.groupBy)
			.order(this.order || 'count desc');
		} else {
			query.order(this.order || ':id');
		}
		if(this.limit) query.limit(this.limit);
		if(this.offset) query.offset(this.offset);
		if(this.q) { query.q(this.q); console.log(this.q) }
		return query.getURL();
	},
	getFriendlyFilters: function() {
		return _.pluck(this.filter, 'friendlyExpression').join(' and ');
	}
})