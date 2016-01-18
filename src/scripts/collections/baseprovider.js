/**
 * Abstract provider class
 */
var Backbone = require('backbone')
var _ = require('underscore')

var model = Backbone.Model.extend({
  idAttribute: 'label'
})

var enclose = function (val) {
  return typeof val === 'string' && val != 'true' && val != 'false' ? "'" + val + "'" : val // eslint-disable-line
}

module.exports = Backbone.Collection.extend({
  model: model,
  initialize: function (models, options) {
    this.options = options || {}
    if (!this.options.triggerField) this.options.triggerField = this.options.groupBy
    if (!this.options.baseFilters) this.options.baseFilters = []
    if (!this.options.filters) this.options.filters = {}
  },
  setFilter: function (filter) {
    if (filter.expression) {
      this.options.filters[filter.field] = filter
    } else {
      delete this.options.filters[filter.field]
    }
  },
  getFilters: function (key) {
    var filters = this.options.filters

    if (key) {
      return filters[key]
    }
    // If dontFilterSelf enabled, remove the filter this collection's triggerField
    // (don't do this if key provided since that's usually done to see if a filter is set
    // rather than to perform an actual filter query)
    if (!_.isEmpty(filters) && this.options.dontFilterSelf) {
      filters = _.omit(filters, this.options.triggerField)
    }

    return _.values(filters)
  },
  parseExpression: function (field, expression) {
    if (expression.type === 'and' || expression.type === 'or') {
      return [
        this.parseExpression(field, expression.value[0]),
        expression.type,
        this.parseExpression(field, expression.value[1])
      ].join(' ')
    } else if (expression.type === 'in' || expression.type === 'not in') {
      return [
        field,
        expression.type,
        '(' + expression.value.map(enclose).join(', ') + ')'
      ].join(' ')
    } else if(expression.type === 'is not' || expression.type == 'is'){
      return [
        field,
        expression.type,
        expression.value
      ].join(' ')
    } else {
      return [
        field,
        expression.type,
        enclose(expression.value)
      ].join(' ')
    }
  },
  getDataset: function () {
    return this.options.dataset
  },
  getTriggerField: function () {
    return this.options.triggerField
  },
  setSearch: function (newValue) {
    this.options.search = newValue
  },
  setDontFilterSelf: function (newValue) {
    this.options.dontFilterSelf = newValue
  },
  setOrder: function (newValue) {
    this.options.order = newValue
  },
  setOffset: function (newValue) {
    this.options.offset = newValue
  },
  setLimit: function (newValue) {
    this.options.limit = newValue
  },
  unsetRecordCount: function () {
    this.recordCount = null
  }
})
