var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var deparam = require('jquery-deparam');
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
		
		// If embedding, only include the desired card
		if(params.card) {
			// Find the card to embed
			var card = _.findWhere(config.cards.concat.apply([], config.cards), {title: params.card});
			if(card) {
				// Make it the only card being iterated
				config.cards = [[card]];
				
				// Add embed class to the <body> to hide other elements
				$('body').addClass('embed');
			}
		}
		
		var container = $('#page-content');
		
		config.cards.forEach(function(columns) {
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
				
				vizwit.init(columnEl, column, {
					vent: vent,
					fields: fields
				});
			});
		});
	},
	error: function() {
		console.error('Error fetching gist', params.gist);
	}
});