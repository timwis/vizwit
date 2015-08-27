var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	Chartist = require('chartist');
//require('chartist-plugin-tooltip');

var colors = {
	primary: {
		fillColor: 'rgba(151,187,205,0.5)',
		strokeColor: 'rgba(151,187,205,0.8)',
		highlightFill: 'rgba(151,187,205,0.75)',
		highlightStroke: 'rgba(151,187,205,1)'
	},
	subdued: {
		fillColor: 'rgba(220,220,220,0.5)',
		strokeColor: 'rgba(220,220,220,0.8)',
		highlightFill: 'rgba(220,220,220,0.75)',
		highlightStroke: 'rgba(220,220,220,1)'
	}
};
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.vent = options.vent || null;
		this.filteredCollection = options.filteredCollection || null;
		
		_.bindAll(this, 'onClick');
		
		//this.ctx = this.el.getContext('2d');
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Listen to collection
		this.listenTo(this.collection, 'sync', this.render);
		this.listenTo(this.filteredCollection, 'sync', this.render);
	},
	events: {
		'click .ct-bar': 'onClick'
	},
	render: function() {
		//console.log(this.collection.toJSON())
		//if(this.chart) this.chart.destroy();
		
		var self = this,
			subset = new Backbone.Collection(this.collection.slice(0, 10)),
			labels = subset.pluck(this.collection.groupBy),
			groupBy = this.collection.groupBy,
			series = [];
			series.push(subset.map(function(model) {
				return {
					value: model.get('count'),
					meta: {
						label: model.get(groupBy)
					}
				};
			}));
			//subset.pluck('count'));
			//}, this.filteredCollection.length ? colors.subdued : colors.primary));
		
		if(this.filteredCollection.length) {
			var data2 = [];
			labels.forEach(function(label) {
				var criteria = {};
				criteria[self.collection.groupBy] = label;
				var match = self.filteredCollection.findWhere(criteria);
				data2.push({
					value: match ? match.get('count') : 0,
					meta: {
						label: label
					}
				});
			});
			series.push(data2);
		}
		
		console.log('creating chart', series)
		
		this.chart = new Chartist.Bar(this.el, {
			labels: labels,
			series: series
		}, {
			seriesBarDistance: 0
		});
	},
	onClick: function(e) {
		/*var bars = this.chart.getBarsAtEvent(e);
		if(bars.length) {
			console.log(this.collection.groupBy, bars[0]);
			this.vent.trigger('filter', this.collection.groupBy, bars[0].label);
			bars[0].strokeColor = 'rgba(151,187,205,1.0)';
			console.log(bars[0])
		}*/
		var label = Chartist.deserialize($(e.currentTarget).attr('ct:meta')).label;
		console.log('Filtering by', label);
		this.vent.trigger('filter', this.collection.groupBy, label);
	},
	onFilter: function(key, value) {
		if(key !== this.filteredCollection.groupBy) {
			console.log('Something else filtered', key, value);
			this.filteredCollection.filter[key] = value;
			this.filteredCollection.fetch();
		}
	}
})