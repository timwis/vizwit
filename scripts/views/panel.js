var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
var FiltersTemplate = require('../templates/filters.html');

var operatorMap = {
	'=': 'is',
	'>': 'is greater than',
	'>=': 'is greater than or equal to',
	'<': 'is less than',
	'<=': 'is less than or equal to',
	'not in': 'is not'
};
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.config = options.config || {};
		this.fields = options.fields || {};
		
		_.bindAll(this, 'onClickRemoveFilter');
		
		// Delegate event here so as not to have it overriden by child classes' events properties
		this.events = _.extend({
			'click .remove-filter': 'onClickRemoveFilter'
		}, this.events || {});
		this.delegateEvents();
		
		// Render template
		this.renderTemplate();
	},
	renderTemplate: function() {
		this.$el.empty().append(Template(this.config));
	},
	renderFilters: function() {
		var self = this;
		var filters = this.filteredCollection ? this.filteredCollection.getFilters(true) : this.collection.getFilters(true);
		
		var parsedFilters = _.map(filters, function(filter) {
			return {
				field: filter.field,
				expression: self.parseExpression(filter.field, filter.expression)
			};
		});
		
		this.$('.filters').empty().append(FiltersTemplate(parsedFilters)).toggle(parsedFilters.length ? true : false);
	},
	parseExpression: function(field, expression) {
		if(expression['type'] === 'and' || expression['type'] === 'or') {
			return [
				this.parseExpression(field, expression.value[0]),
				expression.type,
				this.parseExpression(field, expression.value[1])
			];
		} else {
			var match = this.fields.get(field);
			return [
				match ? match.get('title') : field,
				operatorMap[expression.type] || expression.type,
				expression.label || expression.value
			];
		}
	},
	onClickRemoveFilter: function(e) {
		var filter = $(e.currentTarget).data('filter');
		if(filter) {
			this.vent.trigger(this.collection.dataset + '.filter', {
				field: filter
			});
		}
		e.preventDefault();
	}
});