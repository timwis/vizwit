var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	soda = require('soda-js');
	
var modelFactory = function(idAttribute) {
	return Backbone.Model.extend({
		idAttribute: idAttribute
	});
};

var model = Backbone.Model.extend({
	idAttribute: 'label'
});
	
module.exports = Backbone.Collection.extend({
	countProperty: 'count',
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
		
		//this.model = modelFactory(options.groupBy);
	},
	url: function() {
		var filter = _.values(this.filter).join(' and ');
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
	}
})