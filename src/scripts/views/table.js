var _ = require('underscore')
var Promise = require('bluebird')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
var $ = require('jquery')
require('datatables')
require('datatables/media/js/dataTables.bootstrap')
require('bootstrap/js/tooltip')

module.exports = Card.extend({
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    this.vent = options.vent || null

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.getDataset() + '.filter', this.onFilter)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)

    this.render()
  },
  render: function () {
    // If table is already initialized, clear it and add the collection to it
    if (this.table) {
      var initializedTable = this.$el.DataTable()
      initializedTable.clear()
      initializedTable.rows.add(this.collection.toJSON()).draw()
    // Otherwise, initialize the table
    } else {
      var columnsPromise

      // If columns specified in the config, use those
      if (this.config.columns) {
        // Map the array of columns to the expected format
        var formattedColumns = this.config.columns.map(function (column) {
          if (typeof column === 'string') {
            return {
              data: column,
              title: column,
              defaultContent: ''
            }
          } else if (typeof column === 'object') {
            column.defaultContent = ''
            return column
          }
        })
        columnsPromise = Promise.resolve(formattedColumns)
      // Otherwise use the collection's getFields method
      } else {
        columnsPromise = this.collection.getFields().then(function (fieldsCollection) {
          return fieldsCollection.toJSON()
        })
      }

      columnsPromise.then(_.bind(function (columns) {
        // Check for columns to hide
        if (_.isArray(this.config.columnsToHide)) {
          columns = _.reject(columns, function (column) {
            return _.contains(this.config.columnsToHide, column.data)
          }, this)
        }

        // Add tooltip for column description
        _.each(columns, function (column) {
          if (!_.isEmpty(column.description)) {
            column.title += ' <span class="fa fa-info-circle" data-toggle="tooltip" data-placement="top" title="' + column.description + '"></span>'
          }
        })

        // Initialize the table
        this.table = this.$('.card-content table').DataTable({
          columns: columns,
          order: [],
          scrollX: true,
          serverSide: true,
          ajax: _.bind(function (data, callback, settings) {
            this.collection.setSearch(data.search.value ? data.search.value : null)

            this.collection.getRecordCount().then(_.bind(function (recordCount) {
              this.recordsTotal = this.recordsTotal || recordCount
              var recordsTotal = this.recordsTotal // for use in callback below
              this.collection.setOffset(data.start || 0)
              this.collection.setLimit(data.length || 25)
              if (data.order.length) {
                this.collection.setOrder(data.columns[data.order[0].column].data + ' ' + data.order[0].dir)
              }
              this.collection.fetch({
                success: function (collection, response, options) {
                  callback({
                    data: collection.toJSON(),
                    recordsTotal: recordsTotal,
                    recordsFiltered: recordCount
                  })
                }
              })
              // Initialize bootstrap-powered tooltips for column descriptions
              $('.dataTables_scrollHeadInner th span[data-toggle="tooltip"]').tooltip({
                container: 'body'
              })
            }, this))
          }, this)
        })
      }, this))
    }
  },
  // When another chart is filtered, filter this collection
  onFilter: function (data) {
    this.collection.setFilter(data)
    this.collection.unsetRecordCount()
    this.table.ajax.reload()
    this.renderFilters()
  }
})
