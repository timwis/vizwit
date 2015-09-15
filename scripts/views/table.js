var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
require('datatables');
require('datatables/media/js/dataTables.bootstrap');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.config = options.config || {};
		this.vent = options.vent || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		
		this.renderTemplate();
		
		// If columns were defined in the config, go straight to render
		// otherwise, fetch columns through the metadata model 
		if(this.config.columns) {
			this.render();
		} else {
			this.listenTo(this.collection.fields, 'sync', this.render);
			this.collection.fields.fetch();
		}
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
			var columns;
			
			if(this.config.columns) {
				columns = this.config.columns.map(function(column) {
					if(typeof column === 'string') {
						return {
							data: column,
							title: column,
							defaultContent: ''
						};
					} else if(typeof column === 'object') {
						column.defaultContent = '';
						return column;
					}
				});
			} else {
				columns = this.collection.fields.toJSON();
			}
			
			// Initialize the table
			this.table = this.$('.viz').DataTable({
				columns: columns,
				scrollX: true,
				pagingType: 'numbers',
				info: false,
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