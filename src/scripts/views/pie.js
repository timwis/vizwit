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

module.exports = Card.extend({
  settings: {
    chart: {
      'type': 'pie',
      theme: 'light',
      titleField: 'label',
      valueField: 'value',
      pulledField: 'pulled',
      innerRadius: '40%',
      groupPercent: 1,
      balloonFunction: function (item, formattedText) {
        var content = '<b>' + item.title + '</b><br>' +
					'Total: ' + item.value.toLocaleString() + ' (' + parseFloat(item.percents.toFixed(2)) + '%)'
        if (item.dataContext.filteredValue !== undefined) {
          content += '<br>Filtered Amount: ' + (+item.dataContext.filteredValue).toLocaleString()
        }
        return content
      },
      labelFunction: function (item, formattedText) {
        return item.title.length > 15 ? item.title.substr(0, 15) + '…' : item.title
      },
      balloon: {},
      autoMargins: false,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      pullOutRadius: '10%',
      pullOutOnlyOne: true,
      labelRadius: 1,
      pieAlpha: 0.8,
      hideLabelsPercent: 5,
      creditsPosition: 'bottom-right',
      startDuration: 0,
      addClassNames: true,
      responsive: {
        enabled: true,
        addDefaultRules: false,
        rules: [
          {
            maxWidth: 450,
            overrides: {
              pullOutRadius: '10%',
              titles: {
                enabled: false
              }
            }
          }
        ]
      }
    }
  },
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    // Save options to view
    options = options || {}
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

    _.bindAll(this, 'onClickSlice')

    // Fetch collection
    this.collection.fetch()
  },
  render: function () {
    // Initialize chart
    var config = $.extend(true, {}, this.settings.chart)
    config.dataProvider = this.formatChartData()

    if (this.filteredCollection.getFilters().length) {
      config.valueField = 'filteredValue'
    }

    // If "other" slice is selected, set other slice to be pulled out
    var otherSliceTitle = config.groupedTitle || 'Other'
    var filter = this.filteredCollection.getFilters(this.filteredCollection.triggerField)
    if (filter && (filter.expression.label || filter.expression.value) === otherSliceTitle) {
      config.groupedPulled = true
    }

    this.chart = AmCharts.makeChart(this.$('.card-content').get(0), config)

    this.chart.addListener('clickSlice', this.onClickSlice)
  },
  formatChartData: function () {
    var self = this
    var chartData = []
    var filter = this.filteredCollection.getFilters(this.filteredCollection.triggerField)

    // Map collection(s) into format expected by chart library
    this.collection.forEach(function (model) {
      var label = model.get('label') + '' // ensure it's a string
      var data = {
        label: label,
        value: model.get('value')
      }
      // If the filtered collection has been fetched, find the corresponding record and put it in another series
      if (self.filteredCollection.getFilters().length) {
        var match = self.filteredCollection.get(label)
        // Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
        data.filteredValue = match ? match.get('value') : 0
      }
      // If this slice is selected, set it to be pulled
      if (filter && filter.expression.value === label) {
        data.pulled = true
      }

      chartData.push(data)
    })
    return chartData
  },
  onClickSlice: function (data) {
    var category = data.dataItem.title

    // If already selected, clear the filter
    var filter = this.filteredCollection.getFilters(this.filteredCollection.triggerField)
    if (filter && (filter.expression.value === category || filter.expression.label === category)) {
      this.vent.trigger(this.collection.dataset + '.filter', {
        field: this.filteredCollection.triggerField
      })
    } else { // Otherwise, add the filter
      // If "Other" slice, get all of the currently displayed categories and send then as a NOT IN() query
      if (_.isEmpty(data.dataItem.dataContext)) {
        var shownCategories = []
        data.chart.chartData.forEach(function (item) {
          if (item.title !== category) {
            shownCategories.push(item.title)
          }
        })

        this.vent.trigger(this.collection.dataset + '.filter', {
          field: this.collection.triggerField,
          expression: {
            'type': 'not in',
            value: shownCategories,
            label: this.config.groupedTitle || 'Other'
          }
        })
      } else { // Otherwise fire a normal = query
        this.vent.trigger(this.collection.dataset + '.filter', {
          field: this.collection.triggerField,
          expression: {
            'type': '=',
            value: category
          }
        })
      }
    }
  },
  // When a chart has been filtered
  onFilter: function (data) {
    // Add the filter to the filtered collection and fetch it with the filter
    this.filteredCollection.setFilter(data)

    // Only re-fetch if it's another chart (since this view doesn't filter itself)
    if (data.field !== this.filteredCollection.triggerField) {
      this.filteredCollection.fetch()
    } else if (!data.expression) { // If it's this chart and the filter is being removed, re-render the chart
      this.render()
    }

    this.renderFilters()
  }
})
