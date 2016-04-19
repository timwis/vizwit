/**
 * Abstract provider class
 */
var Backbone = require('backbone')
var _ = require('underscore')
var BaseFields = require('./basefields')

var model = Backbone.Model.extend({
  idAttribute: 'label'
})

var enclose = function (val) {
  if (typeof val === 'string' && val != 'true' && val != 'false') { // eslint-disable-line
    return "'" + val + "'"
  } else if (val === null) {
    return 'null'
  } else {
    return val
  }
}

module.exports = Backbone.Collection.extend({
  model: model,
  initialize: function (models, options) {
    options = options || {}
    this.config = options.config || {}
    if (!this.config.triggerField) this.config.triggerField = this.config.groupBy
    if (!this.config.baseFilters) this.config.baseFilters = []
    if (!this.config.filters) this.config.filters = {}

    this.fieldsCache = options.fieldsCache || {}
    // Check if fieldsCache already has a collection for this dataset, otherwise create one
    if (!this.fieldsCache[this.config.dataset]) {
      this.fieldsCache[this.config.dataset] = new this.fieldsCollection(null, this.config) // eslint-disable-line
    }
  },
  fieldsCollection: BaseFields,
  setFilter: function (filter) {
    if (filter.expression) {
      this.config.filters[filter.field] = filter
    } else {
      delete this.config.filters[filter.field]
    }
  },
  getFilters: function (key) {
    var filters = this.config.filters

    if (key) {
      return filters[key]
    }
    // If dontFilterSelf enabled, remove the filter this collection's triggerField
    // (don't do this if key provided since that's usually done to see if a filter is set
    // rather than to perform an actual filter query)
    if (!_.isEmpty(filters) && this.config.dontFilterSelf) {
      filters = _.omit(filters, this.config.triggerField)
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
    } else {
      return [
        field,
        expression.type,
        enclose(expression.value)
      ].join(' ')
    }
  },
  getDataset: function () {
    return this.config.dataset
  },
  getTriggerField: function () {
    return this.config.triggerField
  },
  getChannel: function () {
    return this.config.dataset + '.filter'
  },
  setSearch: function (newValue) {
    this.config.search = newValue
  },
  setDontFilterSelf: function (newValue) {
    this.config.dontFilterSelf = newValue
  },
  setOrder: function (newValue) {
    this.config.order = newValue
  },
  setOffset: function (newValue) {
    this.config.offset = newValue
  },
  setLimit: function (newValue) {
    this.config.limit = newValue
  },
  unsetRecordCount: function () {
    this.recordCount = null
  }
})
