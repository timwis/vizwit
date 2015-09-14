var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
var numberFormatter = require('../util/number-formatter');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
window.AmCharts_path = './';
require('amcharts3');
require('amcharts3/amcharts/serial');
require('amcharts3/amcharts/themes/light');
require('amcharts3/amcharts/plugins/responsive/responsive');
	
module.exports = Backbone.View.extend({
	settings: {
		/*limit: null,
		collectionOrder: null,
		graphs: [
			{
				title: 'Data',
				valueField: 'count',
				fillAlphas: 1,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Total: [[value]]'
			},
			{
				title: 'Filtered Data',
				valueField: 'filteredCount',
				fillAlphas: 0.8,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Filtered Amount: [[value]]'
			}
		],
		chart: {
			'type': 'serial',
			theme: 'light',
			categoryField: 'label',
			valueAxes: [{
				labelFunction: numberFormatter,
				position: 'right',
				inside: true,
				axisThickness: 0,
				axisAlpha: 0,
				tickLength: 0,
				ignoreAxisWidth: true
			}],
			categoryAxis: {
				autoWrap: true
			}
		}*/
	},
	initialize: function(options) {
		// Save options to view
		options = options || {};
		this.config = options.config || {};
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
		
		// Render template
		this.renderTemplate();
	},
	renderTemplate: function() {
		this.$el.empty().append(Template(this.config));
	},
	renderFilters: function() {
		var filters = this.filteredCollection.getFriendlyFilters();
		this.$('.filters').text(filters).parent().toggle(filters ? true : false);
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
		if(this.collection.selected) {
			console.log('adding guide', this.collection.selected)
			if(config.categoryAxis.parseDates) {
				guide.date = this.collection.selected[0];
				guide.toDate = this.collection.selected[1];
			} else {
				guide.category = guide.toCategory = this.collection.selected;
			}
		} else {
			console.log('removing guide')
			if(guide.date) delete guide.date;
			if(guide.toDate) delete guide.toDate;
			if(guide.category) delete guide.category;
		}
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Only listen to other charts
		if(data.field !== this.filteredCollection.triggerField) {
			// Add the filter to the filtered collection and fetch it with the filter
			if(data.expression) {
				this.filteredCollection.filter[data.field] = data;
			} else {
				delete this.filteredCollection.filter[data.field];
			}
			this.filteredCollection.fetch();
			this.renderFilters();
		} else {
			// Re-render to show the guides when they're initially set
			//this.render();
			this.updateGuide(this.chart);
			this.chart.validateData();
		}
	}
})