var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Panel = require('./panel');
var numberFormatter = require('../util/number-formatter');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
window.AmCharts_path = './';
require('amcharts3');
require('amcharts3/amcharts/pie');
require('amcharts3/amcharts/themes/light');
require('amcharts3/amcharts/plugins/responsive/responsive');
	
module.exports = Panel.extend({
	settings: {
		chart: {
			'type': 'pie',
			theme: 'light',
			titleField: 'label',
			valueField: 'count',
			pulledField: 'pulled',
			groupPercent: 1,
			balloonFunction: function(item, formattedText) {
				var content = '<b>' + item.title + '</b><br> \
					Total: ' + item.value.toLocaleString() + ' (' + parseFloat(item.percents.toFixed(2)) + '%)';
				if(item.dataContext.filteredCount !== undefined) {
					content += '<br>Filtered Amount: ' + (+item.dataContext.filteredCount).toLocaleString();
				}
				return content;
			},
			labelFunction: function(item, formattedText) {
				return item.title.length > 15 ? item.title.substr(0, 15) + '…' : item.title;
			},
			balloon: {},
			autoMargins: false,
			marginTop: 0,
			marginBottom: 0,
			marginLeft: 0,
			marginRight: 0,
			pullOutRadius: '10%',
			pullOutOnlyOne: true,
			labelRadius: 1,
			hideLabelsPercent: 5,
			creditsPosition: 'bottom-right',
			startDuration: 0,
			responsive: {
				enabled: true,
				addDefaultRules: false,
				rules: [
					{
						maxWidth: 450,
						overrides: {
							pullOutRadius: '10%',
							titles: {
								enabled: false
							}
						}
					}
				]
			}
		}
	},
	initialize: function(options) {
		Panel.prototype.initialize.apply(this, arguments);
		
		// Save options to view
		options = options || {};
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
		
		_.bindAll(this, 'onClickSlice');
		
		// Fetch collection
		this.collection.fetch();
	},
	render: function() {
		// Initialize chart
		var config = $.extend(true, {}, this.settings.chart);
		config.dataProvider = this.formatChartData();
		
		if( ! _.isEmpty(this.filteredCollection.filter)) {
			config.valueField = 'filteredCount';
		}
		
		// If "other" slice is selected, set other slice to be pulled out
		var otherSliceTitle = config.groupedTitle || 'Other'
		var filter = this.filteredCollection.filter[this.filteredCollection.triggerField];
		if(filter && filter.selected === otherSliceTitle) {
			config.groupedPulled = true;
		}
		
		this.chart = AmCharts.makeChart(this.$('.viz').get(0), config);
		
		this.chart.addListener('clickSlice', this.onClickSlice);
	},
	formatChartData: function() {
		var self = this;
		var chartData = [];
		var filter = this.filteredCollection.filter[this.filteredCollection.triggerField];
		
		// Map collection(s) into format expected by chart library
		this.collection.forEach(function(model) {
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
			// If this slice is selected, set it to be pulled
			if(filter && filter.selected === label) {
				data.pulled = true;
			}
					
			chartData.push(data);
		});
		return chartData;
	},
	onClickSlice: function(data) {
		var category = data.dataItem.title;
		
		// If already selected, clear the filter
		var filter = this.filteredCollection.filter[this.filteredCollection.triggerField];
		if(filter && filter.selected === category) {
			this.vent.trigger('filter', {
				dataset: this.filteredCollection.dataset,
				field: this.filteredCollection.triggerField
			})
		}
		// Otherwise, add the filter
		else {			
			// If "Other" slice, get all of the currently displayed categories and send then as a NOT IN() query
			if(_.isEmpty(data.dataItem.dataContext)) {
				var shownCategories = [];
				data.chart.chartData.forEach(function(item) {
					if(item.title !== category) {
						shownCategories.push(item.title);
					}
				});
				
				this.vent.trigger('filter', {
					dataset: this.collection.dataset,
					field: this.collection.triggerField,
					selected: category,
					expression: this.collection.triggerField + ' not in(\'' + shownCategories.join('\',\'') + '\')',
					friendlyExpression: this.collection.triggerField + ' is not ' + shownCategories.join(', ')
				});
			}
			// Otherwise fire a normal = query
			else {
				this.vent.trigger('filter', {
					dataset: this.collection.dataset,
					field: this.collection.triggerField,
					selected: category,
					expression: this.collection.triggerField + ' = \'' + category + '\'',
					friendlyExpression: this.collection.triggerField + ' is ' + category
				});
			}
		}
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Only listen on this dataset
		if(data.dataset === this.filteredCollection.dataset) {
			// Add the filter to the filtered collection and fetch it with the filter
			if(data.expression) {
				this.filteredCollection.filter[data.field] = data;
			} else {
				delete this.filteredCollection.filter[data.field];
				
				// If this view's filter is being removed, re-render it (since this view doesn't filter itself)
				if(data.field === this.filteredCollection.triggerField) {
					this.render();
				}
			}
			this.renderFilters();
			
			// Only re-fetch if it's another chart (since this view doesn't filter itself)
			if(data.field !== this.filteredCollection.triggerField) {
				this.filteredCollection.fetch();
			}
		}
	}
})