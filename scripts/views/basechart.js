var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	Extendr = require('extendr'),
	numberFormatter = require('../util/number-formatter');
require('amcharts/dist/amcharts/amcharts');
require('amcharts/dist/amcharts/serial');
require('amcharts/dist/amcharts/themes/light');
	
module.exports = Backbone.View.extend({
	settings: {
		limit: null,
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
				labelFunction: numberFormatter
			}],
			categoryAxis: {
				autoWrap: true
			}
		}
	},
	initialize: function(options) {
		// Save options to view
		options = options || {};
		this.vent = options.vent || null;
		this.filteredCollection = options.filteredCollection || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		this.listenTo(this.filteredCollection, 'sync', this.render);
		
		// Set collection order if specified (necessary for datetime chart)
		if(this.settings.collectionOrder) this.collection.order = this.settings.collectionOrder;
		
		// Fetch collection
		this.collection.fetch();
	},
	render: function() {
		// Map collection to expected format
		var chartData = this.formatChartData(this.settings.limit);
		
		// Define the series/graph for the original amount
		var graphs = [Extendr.deepClone(this.settings.graphs[0])];
		
		// If there's a filtered amount, define the series/graph for it
		if(this.filteredCollection.length) {
			// Change color of original graph to subdued
			graphs[0].lineColor = '#ddd';
			
			graphs.push(Extendr.deepClone(this.settings.graphs[1]));
		}
		
		// Initialize chart
		var config = Extendr.dereference(this.settings.chart);
		config.graphs = graphs;
		config.dataProvider = chartData;
		this.chart = AmCharts.makeChart(this.el, config);
	},
	formatChartData: function(limit) {
		var self = this,
			chartData = [],
			records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection;
		
		// Map collection(s) into format expected by chart library
		records.forEach(function(model) {
			var label = model.get('label'),
				data = {
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
	// When a chart has been filtered
	onFilter: function(key, value) {
		// Only listen to other charts
		if(key !== this.filteredCollection.groupBy) {
			// Add the filter to the filtered collection and fetch it with the filter
			this.filteredCollection.filter[key] = value;
			this.filteredCollection.fetch();
		}
	}
})