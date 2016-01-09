var Backbone = require('backbone')

var model = Backbone.Model.extend({
  idAttribute: 'data'
})

module.exports = Backbone.Collection.extend({
  typeMap: {
    'calendar_date': 'date',
    'number': 'num',
    'money': 'num',
    'default': 'string'
  },
  model: model,
  comparator: 'position',
  initialize: function (models, options) {
    // Save config to collection
    options = options || {}
    this.domain = options.domain || null
    this.dataset = options.dataset || null
  },
  url: function () {
    return [
      'https://',
      this.domain,
      '/api',
      '/views',
      '/' + this.dataset,
      '.json'
    ].join('')
  },
  parse: function (response) {
    var self = this

    // Parse out sort field and order
    var sortId, sortDir
    if (response.query && response.query.orderBys && response.query.orderBys.length && response.query.orderBys[0].expression) {
      sortId = response.query.orderBys[0].expression.columnId
      sortDir = response.query.orderBys[0].ascending ? 'asc' : 'desc'
    }

    return response.columns.map(function (row, key) {
      if (sortId && row.id === sortId) {
        self.sortKey = key
        self.sortDir = sortDir
      }
      return {
        data: row.fieldName,
        title: row.name,
        'type': self.typeMap[row.renderTypeName] || self.typeMap['default'],
        defaultContent: ''
      }
    })
  }
})
