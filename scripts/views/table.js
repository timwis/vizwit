var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
require('datatables');
require('datatables/media/js/dataTables.bootstrap');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.config = options.config || {};
		this.vent = options.vent || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch collection
		this.renderTemplate();
		this.render();
	},
	renderTemplate: function() {
		this.$el.empty().append(Template(this.config));
	},
	renderFilters: function() {
		var filters = this.collection.getFriendlyFilters();
		this.$('.filters').text(filters).parent().toggle(filters ? true : false);
	},
	render: function() {
		var self = this;
		// If table is already initialized, clear it and add the collection to it
		if(this.table) {
			this.$el.DataTable().clear().rows.add(this.collection.toJSON()).draw();
		}
		// Otherwise, initialize the table
		else {
			// Map the array of columns to the expected format
			var columns = this.config.columns.map(function(column) {
				return {
					data: column,
					title: column,
					defaultContent: ''
				};
			});
			
			// Initialize the table
			this.table = this.$('.card').DataTable({
				columns: columns,
				scrollX: true,
				pagingType: 'numbers',
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
	onFilter: function(data) {
		if(data.expression) {
			this.collection.filter[data.field] = data;
		} else {
			delete this.collection.filter[data.field];
		}
		this.table.ajax.reload();
		this.renderFilters();
	}
});