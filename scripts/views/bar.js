var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	BaseChart = require('./basechart'),
	numberFormatter = require('../util/number-formatter');
	
module.exports = BaseChart.extend({
	settings: {
		limit: 10,
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
			valueAxes: [{
				labelFunction: numberFormatter
			}],
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
		
		this.chart.addListener('clickGraphItem', this.onClick);
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', this.collection.triggerField, this.collection.triggerField + ' = \'' + e.item.category + '\'');
	}
})