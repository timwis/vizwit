var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	
	Socrata = require('./collections/socrata'),
	Bar = require('./views/bar'),
	Table = require('./views/table');
	
var vent = _.clone(Backbone.Events);

// Find cards
$('.card').each(function(index, el) {
	var config = $(el).data();
	
	var collection = new Socrata(null, config);
	var filteredCollection = new Socrata(null, config);
	
	switch(config.chartType) {
		case 'bar':
			new Bar({
				el: el,
				collection: collection,
				filteredCollection: filteredCollection,
				vent: vent
			});
			break;
		case 'table':
			new Table({
				el: el,
				collection: collection,
				vent: vent
			});
			break;
	}
});