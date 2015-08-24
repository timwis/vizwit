var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	
	Socrata = require('./collections/socrata'),
	Bar = require('./views/bar');
	
var vent = _.clone(Backbone.Events);

// Find cards
$('.card').each(function(index, el) {
	var config = $(el).data();
	
	var collection = new Socrata(null, config),
		filteredCollection = new Socrata(null, config);
		
	new Bar({
		el: el,
		collection: collection,
		filteredCollection: filteredCollection,
		vent: vent
	});
	
	collection.fetch();
});