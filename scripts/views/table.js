var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
require('datatables');
require('../../assets/js/datatables/dataTables.bootstrap');

var sampleColumns = [
	{data: 'division', title: 'division', defaultContent: ''},
	{data: 'fine', title: 'fine', defaultContent: ''},
	{data: 'issue_date_and_time', title: 'issue_date_and_time', defaultContent: ''},
	{data: 'issuing_agency', title: 'issuing_agency', defaultContent: ''},
	{data: 'location', title: 'location', defaultContent: ''},
	{data: 'plate_id', title: 'plate_id', defaultContent: ''},
	{data: 'state', title: 'state', defaultContent: ''},
	{data: 'violation_description', title: 'violation_description', defaultContent: ''}
];
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.vent = options.vent || null;
		
		// Listen to collection
		//this.listenTo(this.collection, 'sync', this.render);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch collection
		//this.collection.fetch();
		this.render();
	},
	render: function() {
		var self = this;
		// If table is already initialized, clear it and add the collection to it
		if(this.table) {
			this.$el.DataTable().clear().rows.add(this.collection.toJSON()).draw();
		}
		// Otherwise, initialize the table
		else {
			// Define the columns from the first model in the collection
			// This is dangerous as the first model may not contain every property
			// This should be done either in a config file or with a metadata request at page init
			/*var columns = [];
			if(this.collection.length) {
				this.collection.at(0).keys().forEach(function(key) {
					columns.push({
						data: key,
						title: key,
						defaultContent: ''
					});
				});
			} else {
				columns = sampleColumns;
			}*/
			
			// Initialize the table
			this.table = this.$el.DataTable({
				columns: sampleColumns,
				serverSide: true,
				ajax: function(data, callback, settings) {
					self.collection.offset = data.start || 0;
					self.collection.limit = data.length || 25;
					self.collection.order = data.columns[data.order[0].column].data + ' ' + data.order[0].dir;
					self.collection.q = data.search.value ? data.search.value : null;
					self.collection.fetch({
						success: function(collection, response, options) {
							callback({data: collection.toJSON()});
						}
					});
				}
			});
		}
	},
	// When another chart is filtered, filter this collection
	onFilter: function(key, expression) {
		this.collection.filter[key] = expression;
		this.table.ajax.reload();
	}
});