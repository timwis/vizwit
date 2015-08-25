var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
require('datatables');
require('../../assets/js/datatables/dataTables.bootstrap');
//require('../../assets/js/datatables/yadcf/jquery.dataTables.yadcf');
//require('../../assets/js/datatables/tabletools/dataTables.tableTools.min');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
	},
	render: function() {
		//var columns = this.collection.length ? this.collection.at(0).keys() : [];
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
		this.$el.DataTable({
			data: this.collection.toJSON(),
			columns: columns
		})
	}
});