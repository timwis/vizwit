var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
require('datatables');
require('../../assets/js/datatables/dataTables.bootstrap');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.vent = options.vent || null;
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
	},
	render: function() {
		if(this.table) {
			this.$el.DataTable().clear().rows.add(this.collection.toJSON()).draw();
		} else {
			var columns = [];
			if(this.collection.length) {
				this.collection.at(0).keys().forEach(function(key) {
					columns.push({
						data: key,
						title: key,
						defaultContent: ''
					});
				});
			}
			console.log('Creating data table', columns, this.collection.toJSON());
			this.table = this.$el.DataTable({
				data: this.collection.toJSON(),
				columns: columns
			});
		}
	},
	onFilter: function(key, value) {
		console.log('Something else filtered', key, value);
		this.collection.filter[key] = value;
		this.collection.fetch();
	}
});