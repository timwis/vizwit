var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseChart = require('./basechart');
var numberFormatter = require('../util/number-formatter');
	
module.exports = BaseChart.extend({
	settings: {
		graphs: [
			{
				'type': 'column',
				title: 'Data',
				valueField: 'count',
				fillAlphas: 1,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Total: [[value]]'
			},
			{
				'type': 'column',
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
			chartScrollbar: {
			},
			maxSelectedSeries: 7,
			zoomOutText: '',
			mouseWheelScrollEnabled: true,
			categoryAxis: {
				autoWrap: true
			}
		}
	},
	initialize: function(options) {
		BaseChart.prototype.initialize.apply(this, arguments);
		
		_.bindAll(this, 'onClick');
	},
	render: function() {		
		BaseChart.prototype.render.apply(this, arguments);
		
		// If there are greater than 10 bars, zoom to the first bar (ideally this would be done by configuration)
		if(this.collection.length > this.settings.chart.maxSelectedSeries) {
			this.chart.zoomToIndexes(0, this.settings.chart.maxSelectedSeries);
		}
		
		this.chart.addListener('clickGraphItem', this.onClick);
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', {
			field: this.collection.triggerField,
			expression: this.collection.triggerField + ' = \'' + e.item.category + '\'',
			friendlyExpression: this.collection.triggerField + ' is ' + e.item.category
		});
	}
})