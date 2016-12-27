var Backbone = require('backbone')
var BaseFields = require('./basefields')

var model = Backbone.Model.extend({
  idAttribute: 'data'
})

module.exports = BaseFields.extend({
  typeMap: {
    number: 'num',
    geometry: 'string',
    default: 'string'
  },
  model: model,
  initialize: function (models, options) {
    this.config = options || {}
  },
  url: function () {
    return [
      'https://',
      this.config.domain,
      '/api/v2/sql?',
      'q=SELECT * FROM ' + this.config.dataset + ' LIMIT 0'
    ].join('')
  },
  parse: function (response) {
    var fields = []

    for (var key in response.fields) {
      fields.push({
        data: key,
        title: key,
        type: response.fields[key].type,
        defaultContent: ''
      })
    }

    return fields
  }
})
