var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseChart = require('./basechart');
var numberFormatter = require('../util/number-formatter');
	
var trimLastCharacter = function(str) {
	return str.substr(0, str.length - 1);
};
	
module.exports = BaseChart.extend({
	settings: {
		collectionOrder: 'label',
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
				balloonText: '<b>[[category]]</b><br>Total: [[count]]<br>Filtered Amount: [[value]]'
			}
		],
		chart: {
			'type': 'serial',
			theme: 'light',
			responsive: {
				enabled: true
			},
			categoryField: 'label',
			marginLeft: 5,
			marginRight: 5,
			marginTop: 0,
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
				autoWrap: true,
				parseDates: true,
				minPeriod: 'MM',
				guides: [{
					lineThickness: 2,
					lineColor: '#ddd64b',
					fillColor: '#ddd64b',
					fillAlpha: 0.4,
					//label: 'Filtered',
					//inside: true,
					//color: '#000',
					balloonText: 'Currently filtered',
					expand: true,
					above: true
				}]
			},
			dataDateFormat: 'YYYY-MM-DDT00:00:00.000', //"2015-04-07T16:21:00.000"
			chartCursor: {
				categoryBalloonDateFormat: "MMM YYYY",
				cursorPosition: "mouse",
				selectWithoutZooming: true,
				oneBalloonOnly: true
			}
		}
	},
	initialize: function() {
		BaseChart.prototype.initialize.apply(this, arguments);
		
		_.bindAll(this, 'onClick');
	},
	render: function() {
		var self = this;
		BaseChart.prototype.render.apply(this, arguments);
		
		// Listen to when the user selects a range
		setTimeout(function() {
			self.chart.chartCursor.addListener('selected', self.onClick);
		}, 100);
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		//console.log('Filtered by', (new Date(e.start)).toISOString(), (new Date(e.end)).toISOString());
		this.collection.selected = [new Date(e.start), new Date(e.end)];
		var field = this.collection.triggerField;
		
		var start = new Date(e.start);
		var startIso = trimLastCharacter(start.toISOString());
		var startFriendly = start.toLocaleDateString();
		
		var end = new Date(e.end);
		var endIso = trimLastCharacter(end.toISOString());
		var endFriendly = end.toLocaleDateString();
		
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', {
			field: field,
			expression: field + ' >= \'' + startIso + '\' and ' + field + ' <= \'' + endIso + '\'',
			friendlyExpression: field + ' is ' + startFriendly + ' to ' + endFriendly
		})
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
			this.render();
		}
	}
})