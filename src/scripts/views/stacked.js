var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Card = require('./card');
var numberFormatter = require('../util/number-formatter');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
require('amcharts3');
require('amcharts3/amcharts/serial');
require('amcharts3/amcharts/themes/light');
require('amcharts3/amcharts/plugins/responsive/responsive');
	
module.exports = Card.extend({
	settings: {
		graphs: [
			{
				'type': 'column',
				title: 'Data',
				valueField: 'value',
				fillAlphas: 0.6,
				clustered: false,
				//lineColor: '#97bbcd',
				balloonText: '<b>[[category]]</b><br>Total: [[value]]'
			}
		],
		chart: {
			'type': 'serial',
			theme: 'light',
			responsive: {
				enabled: true,
				rules: [
					{
						maxWidth: 600,
						overrides: {
							maxSelectedSeries: 5
						}
					},
					{
						maxWidth: 450,
						overrides: {
							maxSelectedSeries: 3,
							chartCursor: {
								enabled: false
							}
						}
					}
				]
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
				includeAllValues: true,
				ignoreAxisWidth: true,
				gridAlpha: 0,
				stackType: '100%'
			}],
			chartCursor: {
				fullWidth: true,
				cursorAlpha: 0.1,
				zoomable: false,
				oneBalloonOnly: true,
				categoryBalloonEnabled: false
			},
			maxSelectedSeries: 10,
			//startDuration: 0.5,
			//startEffect: 'easeOutSine',
			zoomOutText: '',
			creditsPosition: 'top-right',
			categoryAxis: {
				autoWrap: true,
				gridAlpha: 0,
				labelFunction: function(label) {
					return label && label.length > 12 ? label.substr(0, 12) + '…' : label;
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
		Card.prototype.initialize.apply(this, arguments);
		
		// Save options to view
		options = options || {};
		this.vent = options.vent || null;
		
		// Listen to vent filters
		this.listenTo(this.vent, this.collection.dataset + '.filter', this.onFilter);
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		
		// Fetch collection
		this.collection.fetch();
		
		_.bindAll(this, 'onClickCursor', 'onClickBar', 'onClickLabel', 'onHover', 'onClickScroll', 'zoomToBeginning');
	},
	events: {
		'click .scroll a': 'onClickScroll'
	},
	render: function() {
		// Initialize chart
		var config = $.extend(true, {}, this.settings.chart);
		config.dataProvider = this.collection.toJSON();
		
		// Set category field if specified in config
		config.categoryField = this.config.labelField || config.categoryField;
		
		// Define the series/graph for the original amount
		config.graphs = [];
		this.config.fields.forEach(function(field) {
			var fieldModel = this.fields.get(field);
			config.graphs.push(_.defaults({
				valueField: field,
				balloonText: '<b>' + field + '</b><br>Total: [[value]]'
			}, this.settings.graphs[0]));
		}, this);
		console.log(config.graphs)
		
		this.updateGuide(config);
		
		// Initialize the chart
		this.chart = AmCharts.makeChart(null, config);
		this.chart.write(this.$('.card-content').get(0));
		
		// If there are greater than 10 bars, zoom to the first bar (ideally this would be done by configuration)
		this.chart.addListener('drawn', this.zoomToBeginning);
		this.zoomToBeginning(); // since rendered isn't called the first time
		
		// Listen to cursor hover changes
		this.chart.chartCursor.addListener('changed', this.onHover);
		
		// Listen to label clicks
		this.chart.categoryAxis.addListener('clickItem', this.onClickLabel);
		
		// If chart cursor is enabled (on larger screens) listen to clicks on it
		if(this.chart.chartCursor.enabled) {
			this.delegateEvents(_.extend({'click .card-content': 'onClickCursor'}, this.events));
		}
		// Otherwise listen to clicks on the bars
		else {
			this.chart.addListener('clickGraphItem', this.onClickBar);
		}
		
		// If there are more records than the default, show scroll bars
		if(this.chart.endIndex - this.chart.startIndex < this.collection.length) {
			this.$('.scroll').removeClass('hidden');
		}
	},
	/*formatChartData: function(limit) {
		var self = this;
		var chartData = [];
		var records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection;
		
		// Map collection(s) into format expected by chart library
		records.forEach(function(model) {
			var label = model.get('label');
			var data = {
				label: label,
				value: model.get('value')
			};
					
			chartData.push(data);
		});
		return chartData;
	},*/
	// Show guide on selected item or remove it if nothing's selected
	updateGuide: function(config) {
		var guide = config.categoryAxis.guides[0];
		var filter = this.collection.getFilters(this.collection.triggerField);
		if(filter) {
			console.log(filter, this.collection.triggerField)
			if(config.categoryAxis.parseDates) {
				guide.date = filter.expression.value[0].value;
				guide.toDate = filter.expression.value[1].value;
			} else {
				guide.category = guide.toCategory = filter.expression.value;
			}
		} else {
			if(guide.date) delete guide.date;
			if(guide.toDate) delete guide.toDate;
			if(guide.category) delete guide.category;
		}
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Add the filter to the filtered collection and fetch it with the filter
		this.collection.setFilter(data);
		this.renderFilters();
		this.collection.fetch();
	},
	zoomToBeginning: function() {
		if(this.collection.length > this.chart.maxSelectedSeries) {
			this.chart.zoomToIndexes(0, this.chart.maxSelectedSeries);
		}
	},
	onClickScroll: function(e) {
		var modification = $(e.currentTarget).data('dir') === 'decrease' ? -1 : 1;
		var displayCount = this.chart.maxSelectedSeries;
		var start = Math.min(this.collection.length - 1 - displayCount, Math.max(0, this.chart.startIndex + modification));
		var end = Math.max(displayCount, Math.min(this.collection.length - 1, this.chart.endIndex + modification));
		
		if(start !== this.chart.startIndex || end !== this.chart.endIndex) {
			this.chart.zoomToIndexes(start, end);
		}
		e.preventDefault();
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
	onClickCursor: function(e) {
		if(this.hovering !== null) {
			this.onSelect(this.hovering.category);
		}
	},
	onClickBar: function(e) {
		this.onSelect(e.item.category);
	},
	onClickLabel: function(e) {
		this.onSelect(e.serialDataItem.category);
	},
	onSelect: function(category) {
		// If already selected, clear the filter
		var filter = this.collection.getFilters(this.collection.triggerField);
		if(filter && filter.expression.value === category) {
			this.vent.trigger(this.collection.dataset + '.filter', {
				field: this.collection.triggerField
			})
		}
		// Otherwise, add the filter
		else {
			// Trigger the global event handler with this filter			
			this.vent.trigger(this.collection.dataset + '.filter', {
				field: this.collection.triggerField,
				expression: {
					'type': '=',
					value: category
				}
			})
		}
	}
})