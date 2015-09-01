var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
	L = require('leaflet');
L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/'; // necessary w/browserify
	
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
		if(this.boundaries.length && this.collection.length) {
			var self = this,
				getColor = function(d) {
					return d > 500000 ? '#08519c' :
						d > 300000 ? '#3182bd' :
						d > 100000 ? '#6baed6' :
						d > 1000 ? '#bdd7e7' :
											'#eff3ff';
				},
				highlightFeature = function(e) {
					var layer = e.target;
					layer.setStyle({
						weight: 5,
						color: '#777'
					});
					if( ! L.Browser.ie && ! L.Browser.opera) {
						layer.bringToFront();
					}
					info.update(layer.feature.properties);
				},
				resetHighlight = function(e) {
					geojson.resetStyle(e.target);
					info.update();
				},
				info = L.control();
			
			info.onAdd = function(map) {
				this._div = L.DomUtil.create('div', 'info'); // create a div with class 'info'
				this.update();
				return this._div;
			}
			
			// method that we will use to update the control based on feature properties passed
			info.update = function(props) {
				this._div.innerHTML = '<h4>' + (props ? props.code : '') + '</h4>';
			}
			
			info.addTo(this.map);
				
			var geojson = L.geoJson(this.boundaries.toJSON(), {
				style: function(feature) {
					var match = self.collection.get(feature.properties.objectid);
					return {
						fillColor: getColor(match.get('count')),
						weight: 2,
						opacity: 1,
						color: '#fff',
						fillOpacity: 0.7
					};
				},
				onEachFeature: function(feature, layer) {
					layer.on({
						mouseover: highlightFeature,
						mouseout: resetHighlight
					});
				}
			}).addTo(this.map);
		}
	}
});