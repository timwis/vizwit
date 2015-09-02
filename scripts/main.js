var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
	
var Socrata = require('./collections/socrata');
var GeoJSON = require('./collections/geojson');
var Bar = require('./views/bar');
var Table = require('./views/table');
var DateTime = require('./views/datetime');
var Choropleth = require('./views/choropleth');
	
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
		case 'datetime':
			new DateTime({
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
		case 'choropleth':
			new Choropleth({
				el: el,
				collection: collection,
				boundaries: new GeoJSON(null, config),
				vent: vent
			});
	}
});