var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	Chartist = require('chartist'),
	numberFormatter = require('../util/number-formatter');
	
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
		this.collection.fetch();
	},
	events: {
		'click .ct-bar': 'onClick'
	},
	render: function() {
		var self = this,
			chartData = [], defaultSeries = [], formattedSeries = [],
		
			// Get the first 10 from the collection (TODO: Add a "remainder" bucket?)
			subset = new Backbone.Collection(this.collection.slice(0, 10)),
			labels = subset.pluck(this.collection.groupBy);
		
		// Map collection(s) into format expected by chart library
		subset.forEach(function(model) {
			defaultSeries.push({
				value: model.get(self.collection.countProperty),
				meta: {
					// Store the name of the bar (chartist doesn't do this by default)
					label: model.get(self.collection.groupBy)
				}
			});
			
			// If the filtered collection has been fetched, find the corresponding record and put it in another series
			if(self.filteredCollection.length) {
				var match = self.filteredCollection.get(model.get(self.collection.groupBy));
				// Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
				formattedSeries.push({
					value: match ? match.get(self.collection.countProperty) : 0,
					meta: {
						label: self.collection.groupBy
					}
				});
			}
		});
		
		// Push series into an array of arrays for the chart
		chartData.push(defaultSeries);
		if(formattedSeries.length) {
			chartData.push(formattedSeries);
		}
		
		// Initialize/reinitialize chart
		this.chart = new Chartist.Bar(this.el, {
			labels: labels,
			series: chartData
		}, {
			// Stack bars on top of one another
			seriesBarDistance: 0,
			
			axisY: {
				// Print labels as 12k, 1M, etc.
				labelInterpolationFnc: numberFormatter
			}
		});
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		// Deserialize meta attribute, which contains the bar's label
		var label = Chartist.deserialize($(e.currentTarget).attr('ct:meta')).label;
		
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', this.collection.groupBy, label);
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