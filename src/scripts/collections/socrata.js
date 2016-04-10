var $ = require('jquery')
var _ = require('underscore')
var Promise = require('bluebird')
var BaseProvider = require('./baseprovider')
var soda = require('soda-js')
var SocrataFields = require('./socrata-fields')

var MAX_ROWS_TO_EXPORT = 100000000 // Export up to 100M records (a null or empty limit only returns 1K records)

module.exports = BaseProvider.extend({
  initialize: function (models, options) {
    BaseProvider.prototype.initialize.apply(this, arguments)
    this.consumer = new soda.Consumer(this.config.domain)
  },
  fieldsCollection: SocrataFields,
  url: function () {
    var filters = this.config.baseFilters.concat(this.getFilters())
    var query = this.consumer.query()
      .withDataset(this.config.dataset)

    // Aggregate & group by
    if (this.config.valueField || this.config.aggregateFunction || this.config.groupBy) {
      // If valueField specified, use it as the value
      if (this.config.valueField) {
        query.select(this.config.valueField + ' as value')
      // Otherwise use the aggregateFunction / aggregateField as the value
      } else {
        // If group by was specified but no aggregate function, use count by default
        if (!this.config.aggregateFunction) this.config.aggregateFunction = 'count'

        // Aggregation
        query.select(this.config.aggregateFunction + '(' + (this.config.aggregateField || '*') + ') as value')
      }

      // Group by
      if (this.config.groupBy) {
        query.select(this.config.groupBy + ' as label')
          .group(this.config.groupBy)

        // Order by (only if there will be multiple results)
        query.order(this.config.order || 'value desc')
      }
    } else {
      // Offset
      if (this.config.offset) query.offset(this.config.offset)

      // Order by
      query.order(this.config.order || ':id')
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
    if (this.config.search) query.q(this.config.search)

    // Limit
    query.limit(this.config.limit || '5000')

    return query.getURL()
  },
  exportUrl: function () {
    var oldLimit = this.config.limit
    this.config.limit = MAX_ROWS_TO_EXPORT
    var exportUrl = this.url().replace(this.config.dataset + '.json', this.config.dataset + '.csv')
    this.config.limit = oldLimit
    return exportUrl
  },
  getRecordCount: function () {
    var self = this
    // If recordCount has already been fetched, return it as a promise
    if (this.recordCount) {
      return Promise.resolve(this.recordCount)
    } else {
      // Save current values
      var oldAggregateFunction = this.config.aggregateFunction
      var oldGroupBy = this.config.groupBy

      // Change values in order to get the URL
      this.config.aggregateFunction = 'count'
      this.config.groupBy = null

      // Get the URL
      var url = this.url()

      // Set the values back
      this.config.aggregateFunction = oldAggregateFunction
      this.config.groupBy = oldGroupBy

      // technically returns a $.Deferred but bluebird throws a warning when
      // returning a promise from within DataTables .ajax
      return $.getJSON(url).then(function (response) {
        self.recordCount = response.length ? response[0].value : 0
        return self.recordCount
      })
    }
  },
  getFields: function () {
    var fields = this.fieldsCache[this.config.dataset]
    // TODO: Is there a better way to detect whether it's been fetched?
    //  (technically it could just have a 0 length after being fetched)
    if (fields.length) {
      return Promise.resolve(fields)
    } else {
      return new Promise(function (resolve, reject) {
        fields.fetch({
          success: resolve,
          error: reject
        })
      })
    }
  }
})
