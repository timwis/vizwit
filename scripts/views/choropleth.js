var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var L = require('mapbox.js');
var geocolor = require('geocolor');
var Template = require('../templates/panel.html');
//L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/'; // necessary w/browserify
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.config = options.config || {};
		this.vent = options.vent || null;
		this.boundaries = options.boundaries || null;
		this.filteredCollection = options.filteredCollection || null;
		
		// Listen to boundaries & collection
		this.listenTo(this.boundaries, 'sync', this.addBoundaries);
		this.listenTo(this.collection, 'sync', this.addBoundaries);
		this.listenTo(this.filteredCollection, 'sync', this.addBoundaries);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch boundaries & collection
		this.boundaries.fetch();
		this.collection.fetch();
		
		// Create a popup object
		this.popup = new L.Popup({ autoPan: false });
		
		_.bindAll(this, 'onMousemove', 'onMouseout', 'onClick', 'render');
		
		// Render template & map at load
		this.renderTemplate();
		setTimeout(this.render, 100);
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Add the filter to the filtered collection and fetch it with the filter
		this.filteredCollection.filter[data.field] = data;
		this.filteredCollection.fetch();
		this.renderFilters();
	},
	renderTemplate: function() {
		this.$el.empty().append(Template(this.config));
	},
	renderFilters: function() {
		var filters = this.filteredCollection.getFriendlyFilters();
		this.$('.filters').text(filters).parent().toggle(filters ? true : false);
	},
	render: function() {
		this.map = L.map(this.$('.card').get(0)).setView([39.95, -75.1667], 11);
		L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
			attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			subdomains: 'abcd',
			minZoom: 0,
			maxZoom: 20,
			ext: 'png'
		}).addTo(this.map);
	},
	addBoundaries: function() {
		var self = this;
		if(this.boundaries.length && this.collection.length) {
			this.datasetInFeatures();
			
			var style = {
				stroke: '#fff',
				weight: 2,
				fillOpacity: 0.7
			};
			
			var colorizeField = this.filteredCollection.length ? 'filteredCount' : 'count';
			var colorized;
			
			if(this.collection.selected) {
				colorized = geocolor.equalIntervals(this.boundaries.toGeoJSON(), colorizeField, 2, ['#eee', '#08519c'], style);
			} else {
				colorized = geocolor.quantiles(this.boundaries.toGeoJSON(), colorizeField, 15, ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'], style);
			}
			
			// Remove any existing layers
			if(this.layer) {
				this.map.removeLayer(this.layer);
			}
			
			this.layer = L.geoJson(colorized, {
				style: L.mapbox.simplestyle.style,
				onEachFeature: function(feature, layer) {
					layer.on({
						mousemove: self.onMousemove,
						mouseout: self.onMouseout,
						click: self.onClick
					});
				}
			}).addTo(this.map);
		}
	},
	/**
	 * Loop through features, find the matching dataset record, and put the specific field into the feature
	 * Done via reference
	 */
	datasetInFeatures: function() {
		var self = this;
		this.boundaries.forEach(function(featureModel) {
			var featureProperties = featureModel.get('properties');
			
			// Find match in collection
			var collectionMatch = self.collection.get(featureProperties[self.boundaries.idAttribute]);
			featureProperties.count = collectionMatch ? +collectionMatch.get(self.collection.countProperty) : 0;
			
			// If filteredCollection has any records, find match there too
			if(self.filteredCollection.length) {
				var filteredCollectionMatch = self.filteredCollection.get(featureProperties[self.boundaries.idAttribute]);
				featureProperties.filteredCount = filteredCollectionMatch ? +filteredCollectionMatch.get(self.filteredCollection.countProperty) : 0;
			}
			
			featureModel.set('properties', featureProperties);
		});
	},
	onMousemove: function(e) {
		var layer = e.target;
		
		// Construct popup HTML (TODO: Move to template)
		var popupContent = '\
			<div class="marker-title">\
			<h2>' + layer.feature.properties[this.boundaries.label] + '</h2>\
			Total: ' + layer.feature.properties.count;
		if(layer.feature.properties.filteredCount !== undefined) {
			popupContent += '<br>Filtered Amount: ' + layer.feature.properties.filteredCount;
		}
		popupContent += '</div>';
	
		this.popup.setLatLng(e.latlng);
		this.popup.setContent(popupContent);
	
		if ( ! this.popup._map) this.popup.openOn(this.map);
		window.clearTimeout(this.closeTooltip);
	
		// highlight feature
		layer.setStyle({
			weight: 3,
			opacity: 0.8,
			color: '#777',
			fillOpacity: 0.9
		});
	
		if ( ! L.Browser.ie && ! L.Browser.opera) {
			layer.bringToFront();
		}
	},
	onMouseout: function(e) {
		var self = this;
		this.layer.resetStyle(e.target);
		this.closeTooltip = window.setTimeout(function() {
			self.map.closePopup();
		}, 100);
	},
	onClick: function(e) {
		var clickedId = this.collection.selected = e.target.feature.properties[this.boundaries.idAttribute];
		var clickedLabel = e.target.feature.properties[this.boundaries.label];
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', {
			field: this.collection.triggerField,
			expression: this.collection.triggerField + ' = \'' + clickedId + '\'',
			friendlyExpression: this.config.title + ' is ' + clickedLabel
		})
	}
});
