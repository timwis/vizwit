var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	Backgrid = require('backgrid');

var sampleColumns = [
	{name: 'division', label: 'division', cell: 'string'},
	{name: 'fine', label: 'fine', cell: 'string'},
	{name: 'issue_date_and_time', label: 'issue_date_and_time', cell: 'string'},
	{name: 'issuing_agency', label: 'issuing_agency', cell: 'string'},
	{name: 'location', label: 'location', cell: 'string'},
	{name: 'plate_id', label: 'plate_id', cell: 'string'},
	{name: 'state', label: 'state', cell: 'string'},
	{name: 'violation_description', label: 'violation_description', cell: 'string'}
]

module.exports = Backgrid.Grid.extend({
	columns: sampleColumns,
	initialize: function(options) {
		options = options || {};
		this.vent = options.vent || null;
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch collection
		this.collection.fetch();
		//this.render();
		
		// Call parent method
		Backgrid.Grid.prototype.initialize.apply(this, arguments);
	},
});
	
/*module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.vent = options.vent || null;
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch collection
		this.collection.fetch();
		//this.render();
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
			var columns = [];
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
			}
			
			// Initialize the table
			console.log('initializing table')
			this.table = this.$el.DataTable({
				data: this.collection.toJSON(),
				columns: columns,
				scrollX: true,
				scrollY: 400,
				deferRender: true,
				scroller: true,
				ajax: function(data, callback, settings) {
					console.log('ajax', arguments)
					self.collection.fetch({
						success: function(collection, response, options) {
							console.log(collection.toJSON())
							callback(collection.toJSON());
						}
					});
				}
			});
		}
	},
	// When another chart is filtered, filter this collection
	onFilter: function(key, value) {
		this.collection.filter[key] = value;
		this.collection.fetch();
	}
});*/