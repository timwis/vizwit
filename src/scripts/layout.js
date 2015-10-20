var $ = global.jQuery = require('jquery');
var _ = global._ = require('underscore');
var Backbone = require('backbone');
var deparam = require('node-jquery-deparam');
require('gridstack/dist/gridstack');

var Header = require('./views/header');
var vizwit = require('./vizwit');
var Gist = require('./collections/gist');

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
		
		var container = $('#page-content');
		var heightInterval = 60; // from gridstack.js
		var current = {x: null, y: null};
		var row;
		
		config.cards.forEach(function(config) {
			// If y suggests we're on a new row (including the first item), create a new row
			if(config.y !== current.y) {
				row = $('<div class="row"></div>');
				container.append(row);
				current.y = config.y;
				current.x = 0;
			}
			
			var column = $('<div/>');
			
			// Add width class
			column.addClass('col-sm-' + config.width);
			
			// If x is not the same as our current x position, add offset class
			if(config.x !== current.x) {
				column.addClass('col-sm-offset-' + (config.x - current.x));
			}
			// Set height of new div
			column.css('min-height', config.height * heightInterval);
			
			// Increment current.x to new starting position
			current.x += config.width;
			
			// Add the div to the current row
			row.append(column);
			
			// Initialize vizwit on new div
			vizwit.init(column, config.vizwit, {
				vent: vent,
				fields: fields
			});
		});
	},
	error: function() {
		console.error('Error fetching gist', params.gist);
	}
});