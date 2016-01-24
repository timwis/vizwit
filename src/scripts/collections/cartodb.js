var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var BaseProvider = require('./baseprovider')
var squel = require('squel')


module.exports = BaseProvider.extend({
  initialize: function (models, options) {
    BaseProvider.prototype.initialize.apply(this, arguments)
    // // Save config to collection
    // options = options || {}
    // this.domain = options.domain || null
    // //this.consumer = new soda.Consumer(this.domain)
    // this.dataset = options.dataset || null
    // this.sql = options.sql || null
    // this.aggregateFunction = options.aggregateFunction || null
    // this.aggregateField = options.aggregateField || null
    // this.valueField = options.valueField || null
    // this.groupBy = options.groupBy || null
    // this.triggerField = options.triggerField || options.groupBy // TODO do we ever need groupBy?
    // this.baseFilters = options.baseFilters || []
    // this.filters = options.filters || {}
    // this.apiKey = options.filters || {}
    // this.order = options.order || null
    // this.limit = options.limit || this.limit
    // this.offset = options.offset || this.offset

    this.countModel = new Backbone.Model()
  },

  url: function () {
    var self = this
    var filters = this.options.baseFilters.concat(this.getFilters())
    var query = squel.select();
    query.from(this.options.dataset);
    // Aggregate & group by

    if (this.options.valueField || this.options.aggregateFunction || this.options.groupBy) {
      // If valueField specified, use it as the value
      if (this.options.valueField) {
        query.field(this.options.valueField + ' as value')
      }
      // Otherwise use the aggregateFunction / aggregateField as the value
      else {
        // If group by was specified but no aggregate function, use count by default
        if (!this.options.aggregateFunction) this.options.aggregateFunction = 'count'

        // Aggregation
        query.field(this.options.aggregateFunction + '(' + (this.options.aggregateField || '*') + ') as value')
      }

      // Group by
      if (this.options.groupBy) {
        query.field(this.options.groupBy + ' as label')
          .group(this.options.groupBy);

        // Order by (only if there will be multiple results)
        // console.log(this.options.order);

        (this.options.order) ? query.order(this.options.order) : query.order('value',false);
      }
    } else {
      // Offset
      if (this.options.offset) query.options.offset(this.offset)

      // Order by


      (this.options.order) ? query.order(this.options.order) : query.order('cartodb_id');
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
    if (this.options.search) query.q(this.options.search)

    // Limit
    query.limit(this.options.limit || '5000')
    //return query.getURL()

    var output = 'https://' + self.options.domain +
           '/api/v2/sql?q=' + query.toString();

    return output;
  },

  exportUrl: function () {
    // TODO generate CartoDB url which generates CSV
    // probably from this.url()
    return this.url()
  },

  /** TODO can be generic in superclass**/
  setFilter: function (filter) {
    if (filter.expression) {
      this.options.filters[filter.field] = filter
    } else {
      delete this.options.filters[filter.field]
    }
  },
  /** TODO can be generic in superclass**/
  getFilters: function (key) {
    var filters = this.options.filters

    if (key) {
      return filters[key]
    } else {
      // If dontFilterSelf enabled, remove the filter this collection's triggerField
      // (don't do this if key provided since that's usually done to see if a filter is set
      // rather than to perform an actual filter query)
      if (!_.isEmpty(filters) && this.options.dontFilterSelf) {
        filters = _.omit(filters, this.options.triggerField)
      }

      return _.values(filters)
    }
  },
  /** TODO can be generic in superclass**/
  // parseExpression: function (field, expression) {
  //   console.log("parseExpression", field, expression)
  //   if (expression['type'] === 'and' || expression['type'] === 'or') {
  //     return [
  //       this.parseExpression(field, expression.value[0]),
  //       expression.type,
  //       this.parseExpression(field, expression.value[1])
  //     ].join(' ')
  //   } else if (expression['type'] === 'in' || expression['type'] === 'not in') {
  //     return [
  //       field,
  //       expression.type,
  //       '(' + expression.value.map(enclose).join(', ') + ')'
  //     ].join(' ')
  //   } else {
  //     return [
  //       field,
  //       expression.type,
  //       expression.value
  //     ].join(' ')
  //   }
  // },

  parse: function (response) {
    return response.rows
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
  }
})
