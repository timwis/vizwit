var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
var numberFormatter = require('../util/number-formatter');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
window.AmCharts_path = './';
require('amcharts3');
require('amcharts3/amcharts/pie');
require('amcharts3/amcharts/themes/light');
require('amcharts3/amcharts/plugins/responsive/responsive');
	
module.exports = Backbone.View.extend({
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
				rules: [
					{
						maxWidth: 450,
						overrides: {
							pullOutRadius: '10%'
						}
					}
				]
			}
		}
	},
	initialize: function(options) {
		// Save options to view
		options = options || {};
		this.config = options.config || {};
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
		
		// Render template
		this.renderTemplate();
	},
	renderTemplate: function() {
		this.$el.empty().append(Template(this.config));
	},
	renderFilters: function() {
		var filters = this.filteredCollection.getFriendlyFilters();
		this.$('.filters').text(filters).parent().toggle(filters ? true : false);
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
		if(this.collection.selected === otherSliceTitle) {
			config.groupedPulled = true;
		}
		
		this.chart = AmCharts.makeChart(this.$('.viz').get(0), config);
		
		this.chart.addListener('clickSlice', this.onClickSlice);
	},
	formatChartData: function() {
		var self = this;
		var chartData = [];
		
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
			if(self.collection.selected === label) {
				data.pulled = true;
			}
					
			chartData.push(data);
		});
		return chartData;
	},
	onClickSlice: function(data) {
		var category = data.dataItem.title;
		
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
			
			// If "Other" slice, get all of the currently displayed categories and send then as a NOT IN() query
			if(_.isEmpty(data.dataItem.dataContext)) {
				var shownCategories = [];
				data.chart.chartData.forEach(function(item) {
					if(item.title !== category) {
						shownCategories.push(item.title);
					}
				});
				
				this.vent.trigger('filter', {
					field: this.collection.triggerField,
					expression: this.collection.triggerField + ' not in(\'' + shownCategories.join('\',\'') + '\')',
					friendlyExpression: this.collection.triggerField + ' is not ' + shownCategories.join(', ')
				});
			}
			// Otherwise fire a normal = query
			else {
				this.vent.trigger('filter', {
					field: this.collection.triggerField,
					expression: this.collection.triggerField + ' = \'' + category + '\'',
					friendlyExpression: this.collection.triggerField + ' is ' + category
				});
			}
		}
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
			
		}
	}
})