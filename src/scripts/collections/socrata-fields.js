var Backbone = require('backbone')

var model = Backbone.Model.extend({
  idAttribute: 'data'
})

module.exports = Backbone.Collection.extend({
  typeMap: {
    calendar_date: 'date',
    number: 'num',
    money: 'num',
    default: 'string'
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
    return response.columns.map(function (row, key) {
      var titleForRow = row.name
      if(!_.isEmpty(row.description)){
        titleForRow += ' <span class="fa fa-info-circle" data-toggle="tooltip" data-placement="top" title="'+row.description+'"></span>'
      }
      return {
        data: row.fieldName,
        title: titleForRow,
        type: this.typeMap[row.renderTypeName] || this.typeMap.default,
        defaultContent: '',
        description: row.description
      }
    }, this)
  }
})
