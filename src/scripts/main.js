var $ = global.jQuery = require('jquery');
var _ = global._ = require('underscore');
var Backbone = require('backbone');
require('gridstack/dist/gridstack');

var Header = require('./views/header');
var vizwit = require('./vizwit');
var config = require('./sample.json');

var vent = _.clone(Backbone.Events);
var fields = {};

if( ! config.version) console.error('No version specified in config');

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

var grid = container.gridstack({ static_grid: true }).data('gridstack');
var markup = '<div><div class="grid-stack-item-content"></div></div>'

config.cards.forEach(function(config) {
	var card = grid.add_widget(markup, config.x || null, config.y || null, config.width || 6, config.height || 1, true);
	vizwit.init($('.grid-stack-item-content', card), config.vizwit, {
		vent: vent,
		fields: fields
	});
	
	// Set card content height to available space in container (necessary since position: absolute)
	var cardContent = $('.card-content', card);
	var availableHeight = card.height();
	$.each(cardContent.siblings(), function() {
		availableHeight -= $(this).height();
	});
	cardContent.height(availableHeight);
});