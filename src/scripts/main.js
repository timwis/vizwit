var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var deparam = require('jquery-deparam');

var Gist = require('./collections/gist');
var Socrata = require('./collections/socrata');
var SocrataFields = require('./collections/socrata-fields');
var GeoJSON = require('./collections/geojson');

var Header = require('./views/header');
var Bar = require('./views/bar');
var Table = require('./views/table');
var DateTime = require('./views/datetime');
var Choropleth = require('./views/choropleth');
var Pie = require('./views/pie');

var vent = _.clone(Backbone.Events);
var fields = {};

var params = window.location.search.substr(1) ? deparam(window.location.search.substr(1)) : {};

// If no gist specified, redirect to homepage
if( ! params.gist) {
	window.location.replace('http://vizwit.io');
}

// Fetch gist
(new Gist(null, {id: params.gist})).fetch({
	success: function(collection, response, options) {	
		if( ! collection.length) return console.error('No files in gist', params.gist);
		
		// If a file was provided, use that one; otherwise use the first file in the gist
		var model = params.file && collection.get(params.file) ? collection.get(params.file) : collection.at(0);
		var config = JSON.parse(model.get('content'));
		
		if( ! config.version) return console.error('No version specified in config');
		
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
				if(params.gist) column.gist = params.gist;
				
				// Add column element to row
				var columnEl = $('<div/>').addClass('col-md-' + width);
				rowEl.append(columnEl);
				
				// Initialize collection
				var collection = new Socrata(null, column);
				var filteredCollection = new Socrata(null, column);
				
				// If we haven't already created a fields collection for this dataset, create one
				if(fields[column.dataset] === undefined) {
					fields[column.dataset] = new SocrataFields(null, column);
					fields[column.dataset].fetch();
				}
				
				// Initialize view
				switch(column.chartType) {
					case 'bar':
						new Bar({
							config: column,
							el: columnEl.get(0),
							collection: collection,
							filteredCollection: filteredCollection,
							fields: fields[column.dataset],
							vent: vent
						});
						break;
					case 'datetime':
						new DateTime({
							config: column,
							el: columnEl,
							collection: collection,
							filteredCollection: filteredCollection,
							fields: fields[column.dataset],
							vent: vent
						});
						break;
					case 'pie':
						collection.dontFilterSelf = true;
						filteredCollection.dontFilterSelf = true;
						new Pie({
							config: column,
							el: columnEl,
							collection: collection,
							filteredCollection: filteredCollection,
							fields: fields[column.dataset],
							vent: vent
						});
						break;
					case 'table':
						new Table({
							config: column,
							el: columnEl,
							collection: collection,
							fields: fields[column.dataset],
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
							fields: fields[column.dataset],
							vent: vent
						});
				}
			});
		});
	},
	error: function() {
		console.error('Error fetching gist', params.gist);
	}
});