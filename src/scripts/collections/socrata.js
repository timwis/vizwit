var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var BaseProvider = require('./baseprovider')
var soda = require('soda-js')

module.exports = BaseProvider.extend({
  initialize: function (models, options) {
    BaseProvider.prototype.initialize.apply(this, arguments)
    this.consumer = new soda.Consumer(this.options.domain)
    this.countModel = new Backbone.Model()
  },
  url: function () {
    var filters = this.options.baseFilters.concat(this.getFilters())
    var query = this.consumer.query()
      .withDataset(this.options.dataset)

    // Aggregate & group by
    if (this.options.valueField || this.options.aggregateFunction || this.options.groupBy) {
      // If valueField specified, use it as the value
      if (this.options.valueField) {
        query.select(this.options.valueField + ' as value')
      // Otherwise use the aggregateFunction / aggregateField as the value
      } else {
        // If group by was specified but no aggregate function, use count by default
        if (!this.options.aggregateFunction) this.options.aggregateFunction = 'count'

        // Aggregation
        query.select(this.options.aggregateFunction + '(' + (this.options.aggregateField || '*') + ') as value')
      }

      // Group by
      if (this.options.groupBy) {
        query.select(this.options.groupBy + ' as label')
          .group(this.options.groupBy)

        // Order by (only if there will be multiple results)
        query.order(this.options.order || 'value desc')
      }
    } else {
      // Offset
      if (this.options.offset) query.offset(this.options.offset)

      // Order by
      query.order(this.options.order || ':id')
    }

    // Where
    if (filters.length) {
      // Parse filter expressions into basic SQL strings and concatenate
      filters = _.map(filters, function (filter) {
        return this.parseExpression(filter.field, filter.expression)
      }, this).join(' and ')
      query.where(filters)
    }

    // Full text search
    if (this.options.search) query.q(this.options.search)

    // Limit
    query.limit(this.options.limit || '5000')

    return query.getURL()
  },
  exportUrl: function () {
    return this.url().replace(this.options.dataset + '.json', this.options.dataset + '.csv')
  },
  getRecordCount: function () {
    var self = this

    // Save current values
    var oldAggregateFunction = this.options.aggregateFunction
    var oldGroupBy = this.options.groupBy

    // Change values in order to get the URL
    this.options.aggregateFunction = 'count'
    this.options.groupBy = null

    // Get the URL
    this.countModel.url = this.url()

    // Set the values back
    this.options.aggregateFunction = oldAggregateFunction
    this.options.groupBy = oldGroupBy

    // If recordCount is already set, return it (as a deferred); otherwise fetch it
    return self.recordCount ? ($.Deferred()).resolve(self.recordCount) : this.countModel.fetch()
      .then(function (response) {
        self.recordCount = response.length ? response[0].value : 0
        return self.recordCount
      })
  },
  unsetRecordCount: function () {
    this.recordCount = null
  }
})
