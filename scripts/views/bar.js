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
				balloonText: '<b>[[category]]</b><br>Total: [[value]]',
				showHandOnHover: true
			},
			{
				'type': 'column',
				title: 'Filtered Data',
				valueField: 'filteredCount',
				fillAlphas: 0.8,
				clustered: false,
				lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Total: [[count]]<br>Filtered Amount: [[value]]',
				showHandOnHover: true
			}
		],
		chart: {
			'type': 'serial',
			theme: 'light',
			responsive: {
				enabled: true,
				rules: [
					{
						maxWidth: 450,
						overrides: {
							maxSelectedSeries: 3
						}
					}
				]
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
			chartScrollbar: {
				resizeEnabled: false,
				dragIcon: 'empty'
			},
			chartCursor: {
				fullWidth: true,
				cursorAlpha: 0.1,
				zoomable: false,
				oneBalloonOnly: true
			},
			maxSelectedSeries: 7,
			zoomOutText: '',
			mouseWheelScrollEnabled: true,
			categoryAxis: {
				autoWrap: true,
				//gridAlpha: 0,
				labelFunction: function(label) {
					return label.length > 10 ? label.substr(0, 10) + '…' : label;
				},
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
			}
		}
	},
	initialize: function(options) {
		BaseChart.prototype.initialize.apply(this, arguments);
		
		_.bindAll(this, 'onClick', 'onHover');
	},
	render: function() {
		BaseChart.prototype.render.apply(this, arguments);
		
		// If there are greater than 10 bars, zoom to the first bar (ideally this would be done by configuration)
		if(this.collection.length > this.settings.chart.maxSelectedSeries) {
			this.chart.zoomToIndexes(0, this.settings.chart.maxSelectedSeries);
		}
		
		this.chart.chartCursor.addListener('changed', this.onHover);
		this.chart.div.onclick = this.onClick;
	},
	// Keep track of which column the cursor is hovered over
	onHover: function(e) {
		if(e.index == null) {
			this.hovering = null;
		} else {
			this.hovering = this.chart.categoryAxis.data[e.index];
		}
	},
	// When the user clicks on a bar in this chart
	onClick: function(e) {
		if(this.hovering !== null) {
			var category = this.hovering.category;
			
			// If already selected, clear the filter
			if(this.collection.selected === category) {
				this.collection.selected = null;
				this.vent.trigger('filter', {
					field: this.collection.triggerField
				})
			}
			// Otherwise, add the filter
			else {
				this.collection.selected = category;
				
				// Trigger the global event handler with this filter
				this.vent.trigger('filter', {
					field: this.collection.triggerField,
					expression: this.collection.triggerField + ' = \'' + category + '\'',
					friendlyExpression: this.collection.triggerField + ' is ' + category
				});
			}
		}
	}
})