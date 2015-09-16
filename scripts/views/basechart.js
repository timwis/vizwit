var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Panel = require('./panel');
var numberFormatter = require('../util/number-formatter');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
window.AmCharts_path = './';
require('amcharts3');
require('amcharts3/amcharts/serial');
require('amcharts3/amcharts/themes/light');
require('amcharts3/amcharts/plugins/responsive/responsive');
	
module.exports = Panel.extend({
	settings: {},
	initialize: function(options) {
		Panel.prototype.initialize.apply(this, arguments);
		
		// Save options to view
		this.vent = options.vent || null;
		this.filteredCollection = options.filteredCollection || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		this.listenTo(this.filteredCollection, 'sync', this.render);
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		this.listenTo(this.filteredCollection, 'request', LoaderOn);
		this.listenTo(this.filteredCollection, 'sync', LoaderOff);
		
		// Set collection order if specified (necessary for datetime chart)
		if(this.settings.collectionOrder) this.collection.order = this.settings.collectionOrder;
		
		// Fetch collection
		this.collection.fetch();
	},
	render: function() {
		// Initialize chart
		var config = $.extend(true, {}, this.settings.chart);
		config.dataProvider = this.formatChartData(this.settings.limit);
		
		// Define the series/graph for the original amount
		config.graphs = [$.extend(true, {}, this.settings.graphs[0])];
		
		// If there's a filtered amount, define the series/graph for it
		if( ! _.isEmpty(this.filteredCollection.filter)) {
			// Change color of original graph to subdued
			config.graphs[0].lineColor = '#ddd';
			config.graphs[0].showBalloon = false;
			
			config.graphs.push($.extend(true, {}, this.settings.graphs[1]));
		}
		
		this.updateGuide(config);
		
		this.chart = AmCharts.makeChart(this.$('.viz').get(0), config);
	},
	formatChartData: function(limit) {
		var self = this;
		var chartData = [];
		var records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection;
		
		// Map collection(s) into format expected by chart library
		records.forEach(function(model) {
			var label = model.get('label');
			var data = {
				label: label,
				count: model.get(self.collection.countProperty)
			};
			// If the filtered collection has been fetched, find the corresponding record and put it in another series
			if(self.filteredCollection.length) {
				var match = self.filteredCollection.get(label);
				// Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
				data.filteredCount = match ? match.get(self.collection.countProperty) : 0;
			}
					
			chartData.push(data);
		});
		return chartData;
	},
	// Show guide on selected item or remove it if nothing's selected
	updateGuide: function(config) {
		var guide = config.categoryAxis.guides[0];
		var filter = this.filteredCollection.filter[this.filteredCollection.triggerField];
		if(filter) {
			if(config.categoryAxis.parseDates) {
				guide.date = filter.selected[0];
				guide.toDate = filter.selected[1];
			} else {
				guide.category = guide.toCategory = filter.selected;
			}
		} else {
			if(guide.date) delete guide.date;
			if(guide.toDate) delete guide.toDate;
			if(guide.category) delete guide.category;
		}
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Only listen on this dataset
		if(data.dataset === this.filteredCollection.dataset) {
			// Add the filter to the filtered collection and fetch it with the filter
			if(data.expression) {
				this.filteredCollection.filter[data.field] = data;
			} else {
				delete this.filteredCollection.filter[data.field];
			}
			this.renderFilters();
			this.filteredCollection.fetch();
		}
	}
})