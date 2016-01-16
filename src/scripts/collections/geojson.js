var Backbone = require('backbone')

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    this.options = options || {}
    this.url = options.boundaries || this.url || null
    this.label = options.boundariesLabel || 'objectid'
    this.idAttribute = options.boundariesId || 'objectid'
  },
  parse: function (response, options) {
    return response.features
  },
  toGeoJSON: function () {
    return {
      type: 'FeatureCollection',
      features: this.toJSON()
    }
  }
})
