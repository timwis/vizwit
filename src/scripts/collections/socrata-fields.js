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
    this.options = options || {}
  },
  url: function () {
    return [
      'https://',
      this.options.domain,
      '/api',
      '/views',
      '/' + this.options.dataset,
      '.json'
    ].join('')
  },
  parse: function (response) {
    // Parse out sort field and order
    var sortId, sortDir
    if (response.query && response.query.orderBys && response.query.orderBys.length && response.query.orderBys[0].expression) {
      sortId = response.query.orderBys[0].expression.columnId
      sortDir = response.query.orderBys[0].ascending ? 'asc' : 'desc'
    }

    return response.columns.map(function (row, key) {
      if (sortId && row.id === sortId) {
        this.sortKey = key
        this.sortDir = sortDir
      }
      return {
        data: row.fieldName,
        title: row.name,
        'type': this.typeMap[row.renderTypeName] || this.typeMap['default'],
        defaultContent: ''
      }
    }, this)
  },
  getSortKey: function () {
    return this.sortKey
  },
  getSortDir: function () {
    return this.sortDir
  }
})
