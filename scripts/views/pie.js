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
					Total: ' + (+item.dataContext.count).toLocaleString() + ' (' + parseFloat(item.percents.toFixed(2)) + '%)';
				if(item.dataContext.filteredCount !== undefined) {
					content += '<br>Filtered Amount: ' + (+item.dataContext.filteredCount).toLocaleString();
				}
				return content;
			},
			labelFunction: function(item, formattedText) {
				return item.title.length > 12 ? item.title.substr(0, 12) + '…' : item.title;
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
			startDuration: 0
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
			
			// Trigger the global event handler with this filter
			this.vent.trigger('filter', {
				field: this.collection.triggerField,
				expression: this.collection.triggerField + ' = \'' + category + '\'',
				friendlyExpression: this.collection.triggerField + ' is ' + category
			});
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