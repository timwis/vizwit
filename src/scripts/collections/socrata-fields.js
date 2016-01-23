var Backbone = require('backbone')
var BaseFields = require('./basefields')

var model = Backbone.Model.extend({
  idAttribute: 'data'
})

module.exports = BaseFields.extend({
  typeMap: {
    calendar_date: 'date',
    number: 'num',
    money: 'num',
    default: 'string'
  },
  model: model,
  comparator: 'position',
  initialize: function (models, options) {
    this.config = options || {}
  },
  url: function () {
    return [
      'https://',
      this.config.domain,
      '/api',
      '/views',
      '/' + this.config.dataset,
      '.json'
    ].join('')
  },
  parse: function (response) {
    return response.columns.map(function (row, key) {
      return {
        data: row.fieldName,
        title: row.name,
        type: this.typeMap[row.renderTypeName] || this.typeMap.default,
        defaultContent: '',
        description: row.description
      }
    }, this)
  }
})
