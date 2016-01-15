var _ = require('underscore')
var L = require('leaflet')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
var hashTable = require('../util/hash-table')
;require('leaflet-choropleth')

module.exports = Card.extend({
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    options = options || {}
    this.vent = options.vent || null
    this.boundaries = options.boundaries || null
    this.filteredCollection = options.filteredCollection || null

    // Listen to boundaries & collection
    this.listenTo(this.boundaries, 'sync', this.addBoundaries)
    this.listenTo(this.collection, 'sync', this.addBoundaries)
    this.listenTo(this.filteredCollection, 'sync', this.addBoundaries)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)
    this.listenTo(this.filteredCollection, 'request', LoaderOn)
    this.listenTo(this.filteredCollection, 'sync', LoaderOff)

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.getDataset() + '.filter', this.onFilter)

    // Fetch boundaries & collection
    this.boundaries.fetch()
    this.collection.fetch()

    // Create a popup object
    this.popup = new L.Popup({ autoPan: false })

    _.bindAll(this, 'onMousemove', 'onMouseout', 'onClick', 'render')

    // Render map at load
    this.render()
  },
  // When a chart has been filtered
  onFilter: function (data) {
    // Add the filter to the filtered collection and fetch it with the filter
    this.filteredCollection.setFilter(data)
    this.filteredCollection.fetch()
    this.renderFilters()
  },
  render: function () {
    this.map = L.map(this.$('.card-content').get(0)) // .setView([39.95, -75.1667], 13)

    // Disable scroll zoom
    this.map.scrollWheelZoom.disable()

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(this.map)
  },
  addBoundaries: function () {
    if (this.boundaries.length && this.collection.length) {
      // Put the dataset into the features
      this.datasetInFeatures()

      // Remove any existing layers
      if (this.layer) {
        this.map.removeLayer(this.layer)
      }

      // Add choropleth layer
      var self = this
      var filtered = this.filteredCollection.getFilters().length
      this.layer = L.choropleth(this.boundaries.toGeoJSON(), {
        valueProperty: filtered ? 'filteredValue' : 'value',
        scale: ['#d9e6ed', '#477a94'],
        steps: 5,
        mode: 'q',
        style: {
          color: '#fff',
          weight: 2,
          fillOpacity: 0.7
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            mousemove: self.onMousemove,
            mouseout: self.onMouseout,
            click: self.onClick
          })
        }
      }).addTo(this.map)

      // Zoom to boundaries of new layer
      this.map.fitBounds((L.featureGroup([this.layer])).getBounds())
    }
  },
  /**
   * Loop through features, find the matching dataset record, and put the specific field into the feature
   * Done via reference
   */
  datasetInFeatures: function () {
    // Create hash table for easy reference
    var collectionValues = hashTable(this.collection.toJSON(), 'label', 'value')
    var filteredCollectionValues = hashTable(this.filteredCollection.toJSON(), 'label', 'value')

    // Add value from hash tables to geojson properties
    var idAttribute = this.boundaries.idAttribute
    var filtered = this.filteredCollection.getFilters().length
    this.boundaries.forEach(function (item) {
      var properties = item.get('properties')
      properties.value = collectionValues[properties[idAttribute]]
      if (filtered) {
        properties.filteredValue = filteredCollectionValues[properties[idAttribute]] || 0
      }
      item.set('properties', properties)
    }, this)
  },
  onMousemove: function (e) {
    var layer = e.target

    // Construct popup HTML (TODO: Move to template)
    var popupContent = '<div class="marker-title">' +
			'<h2>' + layer.feature.properties[this.boundaries.label] + '</h2>' +
			'Total: ' + layer.feature.properties.value.toLocaleString()
    if (layer.feature.properties.filteredValue !== undefined) {
      popupContent += '<br>Filtered Amount: ' + layer.feature.properties.filteredValue.toLocaleString()
    }
    popupContent += '</div>'

    this.popup.setLatLng(e.latlng)
    this.popup.setContent(popupContent)

    if (!this.popup._map) this.popup.openOn(this.map)
    window.clearTimeout(this.closeTooltip)

    // highlight feature
    layer.setStyle({
      weight: 4,
      opacity: 0.8
    })

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront()
    }
  },
  onMouseout: function (e) {
    var self = this
    this.layer.resetStyle(e.target)
    this.closeTooltip = window.setTimeout(function () {
      self.map.closePopup()
    }, 100)
  },
  onClick: function (e) {
    var clickedId = e.target.feature.properties[this.boundaries.idAttribute]
    var clickedLabel = e.target.feature.properties[this.boundaries.label]

    // If already selected, clear the filter
    var filter = this.filteredCollection.getFilters(this.filteredCollection.getTriggerField())
    if (filter && filter.expression.value === clickedId) {
      this.vent.trigger(this.filteredCollection.getDataset() + '.filter', {
        field: this.filteredCollection.getTriggerField()
      })
    // Otherwise, add the filter
    } else {
      // Trigger the global event handler with this filter
      this.vent.trigger(this.filteredCollection.getDataset() + '.filter', {
        field: this.collection.getTriggerField(),
        expression: {
          'type': '=',
          value: clickedId,
          label: clickedLabel
        }
      })
    }
  }
})
