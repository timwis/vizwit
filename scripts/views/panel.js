var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../templates/panel.html');
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.config = options.config || {};
		
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
		var filters = this.filteredCollection ? this.filteredCollection.filter : this.collection.filter;
		var strings = [];
		for(var i in filters) {
			strings.push(filters[i].friendlyExpression + ' <a href="#" data-filter="' + i + '" class="remove-filter"><span class="glyphicon glyphicon-remove"></span></a>');
		}
		var content = strings.join(' and ');
		this.$('.filters').empty().append(content).parent().toggle(content ? true : false);
	},
	onClickRemoveFilter: function(e) {
		var filter = $(e.currentTarget).data('filter');
		if(filter) {
			this.vent.trigger('filter', {
				dataset: this.collection.dataset,
				field: filter
			});
		}
		e.preventDefault();
	}
});