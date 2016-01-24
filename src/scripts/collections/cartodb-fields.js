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
    this.options = options || {}
    //this.domain = options.domain || null
    //this.dataset = options.dataset || null
  },
  url: function () {
    return [
      'https://',
      this.options.domain,
      '/',
      'api/v2/sql?',
      'q=SELECT * FROM ' + this.options.dataset + ' LIMIT 1'
    ].join('')
  },
  parse: function (response) {
    this.sortKey = '0'
    this.sortDir = 'asc'

    //fields should be an array of objects that look like this
    //     5: Object
    // data: "doing_business_as_name"
    // defaultContent: ""
    // mData: "doing_business_as_name"
    // sDefaultContent: ""
    // sTitle: "DOING BUSINESS AS NAME"
    // sType: "string"
    // title: "DOING BUSINESS AS NAME"
    // type: "string"

    var fields = [];

    for (var key in response.fields) {
      fields.push({
        data: key,
        sTitle: key,
        type: response.fields[key].type
      })
    }

    return fields

    // TODO return map of columns to types
    // Parse out sort field and order
    //var sortId, sortDir
    //if (response.query && response.query.orderBys && response.query.orderBys.length && response.query.orderBys[0].expression) {
    //  sortId = response.query.orderBys[0].expression.columnId
    //  sortDir = response.query.orderBys[0].ascending ? 'asc' : 'desc'
    //}

    //return response.columns.map(function (row, key) {
    //  if (sortId && row.id === sortId) {
    //    self.sortKey = key
    //    self.sortDir = sortDir
    //  }
    //  return {
    //    data: row.fieldName,
    //    title: row.name,
    //    'type': self.typeMap[row.renderTypeName] || self.typeMap['default'],
    //    defaultContent: ''
    //  }
    //})
  },
  getSortKey: function () {
    return this.sortKey
  },
  getSortDir: function () {
    return this.sortDir
  }
})
