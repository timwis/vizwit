var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var deparam = require('jquery-deparam');

var Socrata = require('./collections/socrata');
var GeoJSON = require('./collections/geojson');

var Header = require('./views/header');
var Bar = require('./views/bar');
var Table = require('./views/table');
var DateTime = require('./views/datetime');
var Choropleth = require('./views/choropleth');

var vent = _.clone(Backbone.Events);

var params = window.location.search.substr(1) ? deparam(window.location.search.substr(1)) : {};
var page = params.page || 'parking-violations';

//var config = require('../config/parking-violations');
$.getJSON('config/' + page + '.json')
.done(function(config) {

	// Render header
	if(config.header) {
		var header = new Header(config.header);
		$('#page-header').append(header.render().el);
		
		// Update <title> tag
		if(config.header.title) {
			var originalTitle = $('title').text();
			$('title').text(config.header.title + ' - ' + originalTitle);
		}
	}
	
	// If embedding, only include the desired panel
	if(params.viz) {
		// Find the panel to embed
		var panel = _.findWhere(config.panels.concat.apply([], config.panels), {title: params.viz});
		if(panel) {
			// Make it the only panel being iterated
			config.panels = [[panel]];
			
			// Add embed class to the <body> to hide other elements
			$('body').addClass('embed');
		}
	}
	
	var container = $('#page-content');
	
	config.panels.forEach(function(columns) {
		var width = Math.round(12 / columns.length);
		var rowEl = $('<div/>').addClass('row');
		
		// Add new row to DOM
		container.append(rowEl);
		
		// Loop through columns in this row
		columns.forEach(function(column) {
			// Pass page name through via config
			column.page = page;
			
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