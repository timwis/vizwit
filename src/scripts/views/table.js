var _ = require('underscore')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
require('datatables')
require('datatables/media/js/dataTables.bootstrap')
require('bootstrap/js/tooltip')

var hideColumns = function (columns, columnsToHide) {
  if (!_.isArray(columnsToHide)) {
    return columns
  }
  return _.reject(columns, function (column) {
    return _.contains(columnsToHide, column.data)
  })
}

var tooltip = function (contents) {
  return '<span class="fa fa-info-circle" data-toggle="tooltip" data-placement="top" title="' + contents + '"></span>'
}

var addDescriptionToTitle = function (column) {
  if (column.description) {
    column.title += ' ' + tooltip(column.description)
  }
  return column
}

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
      this.collection.getFields().then(_.bind(function (fieldsCollection) {
        var columns = fieldsCollection.toJSON()

        columns = hideColumns(columns, this.config.columnsToHide)

        columns = columns.map(addDescriptionToTitle)

        // Initialize the table
        var container = this.$('.card-content table')
        this.table = container.DataTable({
          columns: columns,
          order: [],
          scrollX: true,
          serverSide: true,
          ajax: _.bind(this.dataTablesAjax, this)
        })

        this.activateTooltips(container)
      }, this))
    }
  },
  // Adjust collection using table state, then pass off to collection.fetch with datatables callback
  dataTablesAjax: function (tableState, dataTablesCallback, dataTablesSettings) {
    this.collection.setSearch(tableState.search.value ? tableState.search.value : null)

    // Get record count first because it needs to be passed into the collection.fetch callback
    this.collection.getRecordCount().then(_.bind(function (recordCount) {
      if (!this.recordsTotal) {
        this.recordsTotal = recordCount
      }
      var recordsTotal = this.recordsTotal // for use in callback below

      this.collection.setOffset(tableState.start || 0)
      this.collection.setLimit(tableState.length || 25)

      if (tableState.order.length) {
        this.collection.setOrder(tableState.columns[tableState.order[0].column].data + ' ' + tableState.order[0].dir)
      }

      this.collection.fetch({
        success: function (collection, response, options) {
          dataTablesCallback({
            data: collection.toJSON(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordCount
          })
        }
      })
    }, this))
  },
  // Initialize bootstrap-powered tooltips for column descriptions
  activateTooltips: function (container) {
    this.$('.dataTables_scrollHeadInner th span[data-toggle="tooltip"]', container).tooltip({
      container: 'body'
    })
  },
  // When another chart is filtered, filter this collection
  onFilter: function (data) {
    this.collection.setFilter(data)
    this.collection.unsetRecordCount()
    this.table.ajax.reload()
    this.renderFilters()
  }
})
