var $ = require('jquery')
var Backbone = require('backbone')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
;require('amcharts3')
;require('amcharts3/amcharts/serial')
;require('amcharts3/amcharts/themes/light')
;require('amcharts3/amcharts/plugins/responsive/responsive')
var AmCharts = window.AmCharts
AmCharts.path = './'

module.exports = Card.extend({
  settings: {},
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    // Save options to view
    this.vent = options.vent || null
    this.filteredCollection = options.filteredCollection || null

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.dataset + '.filter', this.onFilter)

    // Listen to collection
    this.listenTo(this.collection, 'sync', this.render)
    this.listenTo(this.filteredCollection, 'sync', this.render)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)
    this.listenTo(this.filteredCollection, 'request', LoaderOn)
    this.listenTo(this.filteredCollection, 'sync', LoaderOff)

    // Set collection order if specified (necessary for datetime chart)
    if (this.settings.collectionOrder) this.collection.order = this.settings.collectionOrder

    // Fetch collection
    this.collection.fetch()
  },
  render: function () {
    // Initialize chart
    var config = $.extend(true, {}, this.settings.chart)
    config.dataProvider = this.formatChartData(this.settings.limit)

    // Define the series/graph for the original amount
    config.graphs = [$.extend(true, {}, this.settings.graphs[0])]

    // If there's a filtered amount, define the series/graph for it
    if (this.filteredCollection.getFilters().length) {
      // Change color of original graph to subdued
      config.graphs[0].lineColor = '#ddd'
      config.graphs[0].showBalloon = false

      config.graphs.push($.extend(true, {}, this.settings.graphs[1]))
    }

    this.updateGuide(config)

    // Initialize the chart
    this.chart = AmCharts.makeChart(null, config)
    this.chart.write(this.$('.card-content').get(0))
  },
  formatChartData: function (limit) {
    var self = this
    var chartData = []
    var records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection

    // Map collection(s) into format expected by chart library
    records.forEach(function (model) {
      var label = model.get('label')
      var data = {
        label: label,
        value: model.get('value')
      }
      // If the filtered collection has been fetched, find the corresponding record and put it in another series
      if (self.filteredCollection.length) {
        var match = self.filteredCollection.get(label)
        // Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
        data.filteredValue = match ? match.get('value') : 0
      }

      chartData.push(data)
    })
    return chartData
  },
  // Show guide on selected item or remove it if nothing's selected
  updateGuide: function (config) {
    var guide = config.categoryAxis.guides[0]
    var filter = this.filteredCollection.getFilters(this.filteredCollection.triggerField)
    if (filter) {
      if (config.categoryAxis.parseDates) {
        guide.date = filter.expression.value[0].value
        guide.toDate = filter.expression.value[1].value
      } else {
        guide.category = guide.toCategory = filter.expression.value
      }
    } else {
      if (guide.date) delete guide.date
      if (guide.toDate) delete guide.toDate
      if (guide.category) delete guide.category
    }
  },
  // When a chart has been filtered
  onFilter: function (data) {
    // Add the filter to the filtered collection and fetch it with the filter
    this.filteredCollection.setFilter(data)
    this.renderFilters()
    this.filteredCollection.fetch()
  }
})
