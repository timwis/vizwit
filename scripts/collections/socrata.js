var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	soda = require('soda-js');
	
var modelFactory = function(idAttribute) {
	return Backbone.Model.extend({
		idAttribute: idAttribute
	});
};
	
module.exports = Backbone.Collection.extend({
	countProperty: 'count',
	initialize: function(models, options) {
		// Save config to collection
		options = options || {};
		this.domain = options.domain || null;
		this.consumer = new soda.Consumer(this.domain);
		this.dataset = options.dataset || null;
		this.groupBy = options.groupBy || null;
		this.filter = options.filter || {};
		
		this.model = modelFactory(options.groupBy);
	},
	url: function() {
		var query = this.consumer.query()
			.withDataset(this.dataset)
			.where(this.filter);
		if(this.groupBy) {
			query.select('count(*), ' + this.groupBy)
			.group(this.groupBy)
			.order('count desc');
		} else {
			query.order(':id');
		}
		return query.getURL();
	}
})