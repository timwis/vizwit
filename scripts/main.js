var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
	
var Socrata = require('./collections/socrata');
var GeoJSON = require('./collections/geojson');

var Header = require('./views/header');
var Bar = require('./views/bar');
var Table = require('./views/table');
var DateTime = require('./views/datetime');
var Choropleth = require('./views/choropleth');

var vent = _.clone(Backbone.Events);

var dataset = window.location.search.substr(1) || 'parking-violations';
//var config = require('../config/parking-violations');
$.getJSON('config/' + dataset + '.json')
.done(function(config) {

	// Render header
	if(config.header) {
		var header = new Header(config.header);
		$('#page-header').append(header.render().el);
	}
	
	var container = $('#page-content');
	
	config.panels.forEach(function(columns) {
		var width = Math.round(12 / columns.length);
		var rowEl = $('<div/>').addClass('row');
		
		// Add new row to DOM
		container.append(rowEl);
		
		// Loop through columns in this row
		columns.forEach(function(column) {
			// Add column element to row
			var columnEl = $('<div/>').addClass('col-md-' + width);
			rowEl.append(columnEl);
			
			// Initialize view
			var collection = new Socrata(null, column);
			var filteredCollection = new Socrata(null, column);
			
			switch(column.chartType) {
				case 'bar':
					new Bar({
						config: column,
						el: columnEl.get(0),
						collection: collection,
						filteredCollection: filteredCollection,
						vent: vent
					});
					break;
				case 'datetime':
					new DateTime({
						config: column,
						el: columnEl,
						collection: collection,
						filteredCollection: filteredCollection,
						vent: vent
					});
					break;
				case 'table':
					new Table({
						config: column,
						el: columnEl,
						collection: collection,
						vent: vent
					});
					break;
				case 'choropleth':
					new Choropleth({
						config: column,
						el: columnEl,
						collection: collection,
						boundaries: new GeoJSON(null, column),
						filteredCollection: filteredCollection,
						vent: vent
					});
			}
		});
	});
})
.fail(function() {
	console.error('Dataset %s not found', dataset);
})