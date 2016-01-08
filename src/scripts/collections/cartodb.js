var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var squel = require('squel')

var model = Backbone.Model.extend({
  idAttribute: 'label'
})

var enclose = function (val) {
  return typeof val === 'string' && val != 'true' && val != 'false' ? "'" + val + "'" : val // eslint-disable-line
}

module.exports = Backbone.Collection.extend({
  model: model,
  initialize: function (models, options) {
    // Save config to collection
    options = options || {}
    this.user = options.user || null
    //this.consumer = new soda.Consumer(this.domain)
    //this.dataset = options.dataset || null
    this.sql = options.sql || null
    //this.aggregateFunction = options.aggregateFunction || null
    //this.aggregateField = options.aggregateField || null
    //this.valueField = options.valueField || null
    //this.groupBy = options.groupBy || null
    this.triggerField = options.triggerField || options.groupBy // TODO do we ever need groupBy?
    this.baseFilters = options.baseFilters || []
    this.filters = options.filters || {}
    this.apiKey = options.filters || {}
    //this.order = options.order || null
    //this.limit = options.limit || this.limit
    //this.offset = options.offset || this.offset

    this.countModel = new Backbone.Model()
  },

  url: function () {
    var self = this
    var filters = this.baseFilters.concat(this.getFilters())
    // TODO generate CartoDB url which generates JSON
    // Where
    if (filters.length) {
    }
    return 'https://' + self.user +
           '.cartodb.com/api/v2/sql?q=' + self.sql
  },

  exportUrl: function () {
    // TODO generate CartoDB url which generates CSV
    // probably from this.url()
    return this.url()
  },

  /** TODO can be generic in superclass**/
  setFilter: function (filter) {
    if (filter.expression) {
      this.filters[filter.field] = filter
    } else {
      delete this.filters[filter.field]
    }
  },
  /** TODO can be generic in superclass**/
  getFilters: function (key) {
    var filters = this.filters

    if (key) {
      return filters[key]
    } else {
      // If dontFilterSelf enabled, remove the filter this collection's triggerField
      // (don't do this if key provided since that's usually done to see if a filter is set
      // rather than to perform an actual filter query)
      if (!_.isEmpty(filters) && this.dontFilterSelf) {
        filters = _.omit(filters, this.triggerField)
      }

      return _.values(filters)
    }
  },
  /** TODO can be generic in superclass**/
  parseExpression: function (field, expression) {
    if (expression['type'] === 'and' || expression['type'] === 'or') {
      return [
        this.parseExpression(field, expression.value[0]),
        expression.type,
        this.parseExpression(field, expression.value[1])
      ].join(' ')
    } else if (expression['type'] === 'in' || expression['type'] === 'not in') {
      return [
        field,
        expression.type,
        '(' + expression.value.map(enclose).join(', ') + ')'
      ].join(' ')
    } else {
      return [
        field,
        expression.type,
        enclose(expression.value)
      ].join(' ')
    }
  },

  parse: function (response) {
    return response.rows
  },

  getRecordCount: function () {
    // TODO get # of records
    return 0
  }
})
