var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	numberFormatter = require('../util/number-formatter');
require('amcharts/dist/amcharts/amcharts');
require('amcharts/dist/amcharts/serial');
require('amcharts/dist/amcharts/themes/light');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		// Save options to view
		options = options || {};
		this.vent = options.vent || null;
		this.filteredCollection = options.filteredCollection || null;
		
		_.bindAll(this, 'onClick');
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		this.listenTo(this.filteredCollection, 'sync', this.render);
		
		// Fetch collection
		this.collection.order = 'label';
		this.collection.fetch();
	},
	render: function() {
		var self = this,
			chartData = [];
		
		// Get the first 10 from the collection (TODO: Add a "remainder" bucket?)
		//var subset = new Backbone.Collection(this.collection.slice(0, 10));
			
		var graphs = [{
			title: 'Data',
			valueField: 'count',
			fillAlphas: 1,
			clustered: false,
			lineColor: '#97bbcd',
			balloonText: '<b>[[category]]</b><br>Total: [[value]]'
		}];
			
		if(this.filteredCollection.length) {
			graphs[0].lineColor = '#ddd';
			graphs.push({
				title: 'Filtered Data',
				valueField: 'filteredCount',
				fillAlphas: 0.8,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Filtered Amount: [[value]]'
			});
		}
		console.log('graphs', graphs)
		
		// Map collection(s) into format expected by chart library
		this.collection.forEach(function(model) {
			var label = model.get('label'),
				data = {
					label: label,
					count: model.get(self.collection.countProperty)
				};
			// If the filtered collection has been fetched, find the corresponding record and put it in another series
			if(self.filteredCollection.length) {
				var match = self.filteredCollection.get(label);
				console.log(label, match)
				// Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
				data.filteredCount = match ? match.get(self.collection.countProperty) : 0;
			}
					
			chartData.push(data);
		});
		
		// TODO: Initialize chart with chartData
		this.chart = AmCharts.makeChart(this.el, {
			type: 'serial',
			theme: 'light',
			categoryField: 'label',
			graphs: graphs,
			dataProvider: chartData,
			valueAxes: [{
				labelFunction: numberFormatter
			}],
			categoryAxis: {
				autoWrap: true,
				parseDates: true,
				minPeriod: 'MM'
			},
			dataDateFormat: 'YYYY-MM-DDT00:00:00.000', //"2015-04-07T16:21:00.000"
			chartCursor: {
				categoryBalloonDateFormat: "MMM D YYYY",
				cursorPosition: "mouse",
				selectWithoutZooming: true
			}
		});
		
		this.chart.chartCursor.addListener('selected', this.onClick);
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		console.log('Filtered by', (new Date(e.start)).toISOString(), (new Date(e.end)).toISOString());
		
		// Trigger the global event handler with this filter
		//this.vent.trigger('filter', this.collection.groupBy, e.item.category);
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