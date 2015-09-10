var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var L = require('mapbox.js');
var geocolor = require('geocolor');
var Template = require('../templates/panel.html');
var LoaderOn = require('../util/loader').on;
var LoaderOff = require('../util/loader').off;
var ColorRange = require('../util/color-range');
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
		
		// Loading indicators
		this.listenTo(this.collection, 'request', LoaderOn);
		this.listenTo(this.collection, 'sync', LoaderOff);
		this.listenTo(this.filteredCollection, 'request', LoaderOn);
		this.listenTo(this.filteredCollection, 'sync', LoaderOff);
		
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
		this.render();
	},
	// When a chart has been filtered
	onFilter: function(data) {
		// Add the filter to the filtered collection and fetch it with the filter
		if(data.expression) {
			this.filteredCollection.filter[data.field] = data;
		} else {
			delete this.filteredCollection.filter[data.field];
		}
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
		this.map = L.map(this.$('.card').get(0));//.setView([39.95, -75.1667], 13);
		L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			maxZoom: 16
		}).addTo(this.map);
	},
	addBoundaries: function() {
		var self = this;
		if(this.boundaries.length && this.collection.length) {
			// Put the dataset into the features
			this.datasetInFeatures();
			
			// Setup a color range utility
			var colorizeField =  _.isEmpty(this.filteredCollection.filter) ? 'count' : 'filteredCount';
			var values = _.chain(this.boundaries.pluck('properties')).pluck(colorizeField).value(); 
			var min = _.min(values);
			var max = _.max(values);
			var colorRange = new ColorRange(['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'], min, max);
			
			// Remove any existing layers
			if(this.layer) {
				this.map.removeLayer(this.layer);
			}
			
			this.layer = L.geoJson(this.boundaries.toGeoJSON(), {
				style: function(feature) {
					return {
						fillColor: colorRange.getColor(feature.properties[colorizeField]),
						color: '#fff',
						weight: 2,
						fillOpacity: 0.7
					}
				},
				onEachFeature: function(feature, layer) {
					layer.on({
						mousemove: self.onMousemove,
						mouseout: self.onMouseout,
						click: self.onClick
					});
				}
			}).addTo(this.map);
			
			// Zoom to boundaries of new layer
			this.map.fitBounds((L.featureGroup([this.layer])).getBounds());
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
			if( ! _.isEmpty(self.filteredCollection.filter)) {
				var filteredCollectionMatch = self.filteredCollection.length ? self.filteredCollection.get(featureProperties[self.boundaries.idAttribute]) : null;
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
			weight: 4,
			opacity: 0.8
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
		var clickedId = e.target.feature.properties[this.boundaries.idAttribute];
		var clickedLabel = e.target.feature.properties[this.boundaries.label];
		
		// If already selected, clear the filter
		if(this.collection.selected === clickedId) {
			this.collection.selected = null;
			this.vent.trigger('filter', {
				field: this.collection.triggerField
			})
		}
		// Otherwise, add the filter
		else {
			this.collection.selected = clickedId;
			
			// Trigger the global event handler with this filter
			this.vent.trigger('filter', {
				field: this.collection.triggerField,
				expression: this.collection.triggerField + ' = \'' + clickedId + '\'',
				friendlyExpression: this.config.title + ' is ' + clickedLabel
			})
		}
	}
});
