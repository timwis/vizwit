var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var soda = require('soda-js')

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
    this.domain = options.domain || null
    this.consumer = new soda.Consumer(this.domain)
    this.dataset = options.dataset || null
    this.aggregateFunction = options.aggregateFunction || null
    this.aggregateField = options.aggregateField || null
    this.valueField = options.valueField || null
    this.groupBy = options.groupBy || null
    this.triggerField = options.triggerField || options.groupBy
    this.baseFilters = options.baseFilters || []
    this.filters = options.filters || {}
    this.order = options.order || null
    this.limit = options.limit || this.limit
    this.offset = options.offset || this.offset

    this.countModel = new Backbone.Model()
  },
  url: function () {
    var self = this
    var filters = this.baseFilters.concat(this.getFilters())
    var query = this.consumer.query()
      .withDataset(this.dataset)

    // Aggregate & group by
    if (this.valueField || this.aggregateFunction || this.groupBy) {
      // If valueField specified, use it as the value
      if (this.valueField) {
        query.select(this.valueField + ' as value')
      } else { // Otherwise use the aggregateFunction / aggregateField as the value
        // If group by was specified but no aggregate function, use count by default
        if (!this.aggregateFunction) this.aggregateFunction = 'count'

        // Aggregation
        query.select(this.aggregateFunction + '(' + (this.aggregateField || '*') + ') as value')
      }

      // Group by
      if (this.groupBy) {
        query.select(this.groupBy + ' as label')
          .group(this.groupBy)

        // Order by (only if there will be multiple results)
        query.order(this.order || 'value desc')
      }
    } else {
      // Offset
      if (this.offset) query.offset(this.offset)

      // Order by
      query.order(this.order || ':id')
    }

    // Where
    if (filters.length) {
      // Parse filter expressions into basic SQL strings and concatenate
      filters = _.map(filters, function (filter) {
        return self.parseExpression(filter.field, filter.expression)
      }).join(' and ')
      query.where(filters)
    }

    // Full text search
    if (this.search) query.q(this.search)

    // Limit
    query.limit(this.limit || '5000')

    return query.getURL()
  },
  exportUrl: function () {
    return this.url().replace(this.dataset + '.json', this.dataset + '.csv')
  },
  setFilter: function (filter) {
    if (filter.expression) {
      this.filters[filter.field] = filter
    } else {
      delete this.filters[filter.field]
    }
  },
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
  getRecordCount: function () {
    var self = this

    // Save current values
    var oldAggregateFunction = this.aggregateFunction
    var oldGroupBy = this.groupBy

    // Change values in order to get the URL
    this.aggregateFunction = 'count'
    this.groupBy = null

    // Get the URL
    this.countModel.url = this.url()

    // Set the values back
    this.aggregateFunction = oldAggregateFunction
    this.groupBy = oldGroupBy

    // If recordCount is already set, return it (as a deferred); otherwise fetch it
    return self.recordCount ? ($.Deferred()).resolve(self.recordCount) : this.countModel.fetch()
      .then(function (response) {
        self.recordCount = response.length ? response[0].value : 0
        return self.recordCount
      })
  }
})
