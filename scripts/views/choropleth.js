var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	L = require('mapbox.js'),
	geocolor = require('geocolor');
//L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/'; // necessary w/browserify
	
module.exports = Backbone.View.extend({
	initialize: function(options) {
		options = options || {};
		this.boundaries = options.boundaries || null;
		this.vent = options.vent || null;
		
		// Listen to boundaries & collection
		this.listenTo(this.boundaries, 'sync', this.addBoundaries);
		this.listenTo(this.collection, 'sync', this.addBoundaries);
		
		// Listen to vent filters
		this.listenTo(this.vent, 'filter', this.onFilter);
		
		// Fetch boundaries & collection
		this.boundaries.fetch();
		this.collection.fetch();
		
		// Create a popup object
		this.popup = new L.Popup({ autoPan: false });
		
		_.bindAll(this, 'onMousemove', 'onMouseout', 'onClick');
		
		// Render map at load
		this.render();
	},
	render: function() {
		this.map = L.map(this.el).setView([39.95, -75.1667], 11);
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
			this.datasetInFeatures(this.boundaries, this.collection, 'count');
			
			var style = {
				stroke: '#fff',
				weight: 2,
				fillOpacity: 0.7
			};
			
			var colorized = geocolor.quantiles(this.boundaries.toGeoJSON(), 'count', 15, ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'], style);
			console.log(colorized)
			
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
	datasetInFeatures: function(featuresCollection, datasetCollection, valueField) {
		featuresCollection.forEach(function(featureModel) {
			var featureProperties = featureModel.get('properties');
			var datasetMatch = datasetCollection.get(featureProperties[featuresCollection.idAttribute]);
			
			featureProperties.count = datasetMatch ? +datasetMatch.get(valueField) : 0;
			featureModel.set('properties', featureProperties);
		});
	},
	onMousemove: function(e) {
		var layer = e.target;
	
		this.popup.setLatLng(e.latlng);
		this.popup.setContent('<div class="marker-title"><h2>' + layer.feature.properties[this.boundaries.label] + '</h2>Total: ' + layer.feature.properties.count + '</div>');
	
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
		var clicked = e.target.feature.properties[this.boundaries.idAttribute];
		console.log('clicked', clicked)
		// Trigger the global event handler with this filter
		this.vent.trigger('filter', this.collection.triggerField, this.collection.triggerField + ' = \'' + clicked + '\'');
	}
});
