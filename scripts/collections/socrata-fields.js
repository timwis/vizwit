var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
	typeMap: {
		'calendar_date': 'date',
		'number': 'num',
		'money': 'num',
		'default': 'string'
	},
	idAttribute: 'data',
	initialize: function(options) {
		// Save config to collection
		options = options || {};
		this.domain = options.domain || null;
		this.dataset = options.dataset || null;
	},
	url: function() {
		return [
			'https://',
			this.domain,
			'/api',
			'/views',
			'/' + this.dataset,
			'.json'
		].join('');
	},
	parse: function(response) {
		var self = this;
		return response.columns.filter(function(row) {
			return ! _.isEmpty(row.format);
		}).map(function(row) {
			return {
				data: row.fieldName,
				title: row.name,
				'type': self.typeMap[row.renderTypeName] || self.typeMap['default'],
				defaultContent: ''
			}
		});
	}
});