var $ = require('jquery')
var _ = require('underscore')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
;require('amcharts3')
;require('amcharts3/amcharts/pie')
;require('amcharts3/amcharts/themes/light')
;require('amcharts3/amcharts/plugins/responsive/responsive')
var AmCharts = window.AmCharts
AmCharts.path = './'
var config = require('./config/pie.config')

var isSliceSelected = function (filteredCollection, sliceTitle) {
  var selfFilter = filteredCollection.getFilters(filteredCollection.getTriggerField())
  return selfFilter && (selfFilter.expression.label || selfFilter.expression.value) === sliceTitle
}

var formatChartData = function (collection, filteredCollection) {
  var chartData = []
  var isFiltered = filteredCollection.getFilters().length
  var selfFilter = filteredCollection.getFilters(filteredCollection.getTriggerField())

  // Map collection(s) into format expected by chart library
  collection.forEach(function (model) {
    var data = {
      label: model.get('label') + '', // ensure it's a string
      value: model.get('value')
    }
    // If the filtered collection has been fetched, find the corresponding record and put it in another series
    if (isFiltered) {
      var filteredCollectionMatch = filteredCollection.get(data.label)
      // Push a record even if there's no match so we don't align w/ the wrong slice in the other collection
      data.filteredValue = filteredCollectionMatch ? filteredCollectionMatch.get('value') : 0
    }
    // If this slice is selected, set it to be pulled
    if (selfFilter && selfFilter.expression.value === data.label) {
      data.pulled = true
    }

    chartData.push(data)
  })
  return chartData
}
var isOtherSlice = function (dataItem) {
  return _.isEmpty(dataItem.dataContext)
}

module.exports = Card.extend({
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    // Save options to view
    this.vent = options.vent || null
    this.filteredCollection = options.filteredCollection || null

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.getChannel(), this.onFilter)

    // Listen to collection
    this.listenTo(this.collection, 'sync', this.render)
    this.listenTo(this.filteredCollection, 'sync', this.render)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)
    this.listenTo(this.filteredCollection, 'request', LoaderOn)
    this.listenTo(this.filteredCollection, 'sync', LoaderOff)

    _.bindAll(this, 'onClickSlice')

    // Fetch collection
    this.collection.fetch()
  },
  render: function () {
    // Initialize chart
    var configCopy = $.extend(true, {}, config) // TODO: Why do we need a copy again?
    configCopy.dataProvider = formatChartData(this.collection, this.filteredCollection)

    if (this.filteredCollection.getFilters().length) {
      configCopy.valueField = 'filteredValue'
    }

    // If "other" slice is selected, set other slice to be pulled out
    var otherSliceTitle = configCopy.groupedTitle || 'Other'
    if (isSliceSelected(this.filteredCollection, otherSliceTitle)) {
      configCopy.groupedPulled = true
    }

    var container = this.$('.card-content').get(0)
    this.chart = AmCharts.makeChart(container, configCopy)

    this.chart.addListener('clickSlice', this.onClickSlice)
  },
  onClickSlice: function (data) {
    var category = data.dataItem.title
    var triggerField = this.filteredCollection.getTriggerField()

    // If already selected, clear the filter
    var selfFilter = this.filteredCollection.getFilters(triggerField)
    if (selfFilter && (selfFilter.expression.label || selfFilter.expression.value) === category) {
      this._fireFilterEvent()
    // Otherwise, add the filter
    } else {
      // If "Other" slice, get all of the currently displayed categories and send then as a NOT IN() query
      if (isOtherSlice(data.dataItem)) {
        var shownCategories = _.pluck(data.chart.chartData, 'title').filter(function (title) {
          return title !== category
        })
        var otherSliceTitle = this.chart.groupedTitle || 'Other'

        this._fireFilterEvent({
          type: 'not in',
          value: shownCategories,
          label: otherSliceTitle
        })
      // Otherwise fire a normal equals query
      } else {
        this._fireFilterEvent({
          type: '=',
          value: category
        })
      }
    }
  },
  _fireFilterEvent: function (expression) {
    var channel = this.collection.getChannel()
    var triggerField = this.filteredCollection.getTriggerField()
    this.vent.trigger(channel, {
      field: triggerField,
      expression: expression
    })
  },
  // When a chart has been filtered
  onFilter: function (data) {
    // Add the filter to the filtered collection and fetch it with the filter
    this.filteredCollection.setFilter(data)

    // Only re-fetch if it's another chart (since this view doesn't filter itself)
    if (data.field !== this.filteredCollection.getTriggerField()) {
      this.filteredCollection.fetch()
    // If it's this chart and the filter is being removed, re-render the chart
    } else if (!data.expression) {
      this.render()
    }

    this.renderFilters()
  }
})
