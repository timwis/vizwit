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
				valueField: 'value',
				fillAlphas: 0.4,
				lineThickness: 4,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Total: [[value]]'
			},
			{
				title: 'Filtered Data',
				valueField: 'filteredValue',
				fillAlphas: 0.4,
				lineThickness: 4,
				clustered: false,
				lineColor: '#97bbcd',
				dateFormat: 'MMM YYYY',
				balloonFunction: function(item, graph) {
					return '<b>' + AmCharts.formatDate(item.category, graph.dateFormat) + '</b><br>\
						Total: ' + (+item.dataContext.value).toLocaleString() + '<br> \
						Filtered Amount: ' + (+item.dataContext.filteredValue).toLocaleString()
				}
			}
		],
		chart: {
			'type': 'serial',
			theme: 'light',
			responsive: {
				enabled: true
			},
			addClassNames: true,
			categoryField: 'label',
			marginLeft: 0,
			marginRight: 0,
			marginTop: 0,
			valueAxes: [{
				labelFunction: numberFormatter,
				position: 'right',
				inside: true,
				axisThickness: 0,
				axisAlpha: 0,
				tickLength: 0,
				minimum: 0,
				gridAlpha: 0
			}],
			categoryAxis: {
				autoWrap: true,
				parseDates: true,
				minPeriod: 'MM',
				gridAlpha: 0,
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
			creditsPosition: 'top-right',
			chartCursor: {
				categoryBalloonDateFormat: "MMM YYYY",
				cursorPosition: "mouse",
				selectWithoutZooming: true,
				oneBalloonOnly: true,
				categoryBalloonEnabled: false
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
		var field = this.collection.triggerField;
		
		var start = new Date(e.start);
		var startIso = trimLastCharacter(start.toISOString());
		var startFriendly = start.toLocaleDateString();
		
		var end = new Date(e.end);
		var endIso = trimLastCharacter(end.toISOString());
		var endFriendly = end.toLocaleDateString();
		
		// Trigger the global event handler with this filter		
		this.vent.trigger(this.collection.dataset + '.filter', {
			field: field,
			expression: {
				'type': 'and',
				value: [
					{
						'type': '>=',
						value: startIso,
						label: startFriendly
					},
					{
						'type': '<=',
						value: endIso,
						label: endFriendly
					}
				]
			}
		})
	}
})