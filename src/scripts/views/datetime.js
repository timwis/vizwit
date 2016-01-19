var $ = require('jquery')
var _ = require('underscore')
var BaseChart = require('./basechart')
var numberFormatter = require('../util/number-formatter')
;require('amcharts3')
var AmCharts = window.AmCharts
AmCharts.path = './'

var trimLastCharacter = function (str) {
  return str.substr(0, str.length - 1)
}

module.exports = BaseChart.extend({
  settings: {
    collectionOrder: 'label',
    graphs: [
      {
        title: 'Data',
        valueField: 'value',
        fillAlphas: 0.4,
        lineThickness: 4,
        clustered: false,
        lineColor: '#97bbcd',
        balloonText: '<b>[[category]]</b><br>Total: [[value]]'
      },
      {
        title: 'Filtered Data',
        valueField: 'filteredValue',
        fillAlphas: 0.4,
        lineThickness: 4,
        clustered: false,
        lineColor: '#97bbcd',
        dateFormat: 'MMM YYYY',
        balloonFunction: function (item, graph) {
          return '<b>' + AmCharts.formatDate(item.category, graph.dateFormat) + '</b><br>' +
						'Total: ' + (+item.dataContext.value).toLocaleString() + '<br>' +
						'Filtered Amount: ' + (+item.dataContext.filteredValue).toLocaleString()
        }
      }
    ],
    chart: {
      type: 'serial',
      theme: 'light',
      responsive: {
        enabled: true
      },
      addClassNames: true,
      categoryField: 'label',
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      valueAxes: [{
        labelFunction: numberFormatter,
        position: 'right',
        inside: true,
        axisThickness: 0,
        axisAlpha: 0,
        tickLength: 0,
        minimum: 0,
        gridAlpha: 0
      }],
      categoryAxis: {
        autoWrap: true,
        parseDates: true,
        minPeriod: 'DD',
        gridAlpha: 0,
        guides: [{
          lineThickness: 2,
          lineColor: '#ddd64b',
          fillColor: '#ddd64b',
          fillAlpha: 0.4,
          // label: 'Filtered',
          // inside: true,
          // color: '#000',
          balloonText: 'Currently filtered',
          expand: true,
          above: true
        }]
      },
      dataDateFormat: 'YYYY-MM-DDT00:00:00.000', // "2015-04-07T16:21:00.000"
      creditsPosition: 'top-right',
      chartCursor: {
        categoryBalloonDateFormat: 'DD MMM YYYY',
        cursorPosition: 'mouse',
        selectWithoutZooming: true,
        oneBalloonOnly: true,
        categoryBalloonEnabled: false
      }
    }
  },
  initialize: function () {
    BaseChart.prototype.initialize.apply(this, arguments)

    _.bindAll(this, 'onClick')
  },
  events: {
    'click .toggle-base-collection-link': 'onClickToggleBaseCollectionLink',
    'click .zoom-to-filtered-collection-link': 'onClickZoomToFilteredCollectionLink'
  },
  render: function () {
    BaseChart.prototype.render.apply(this, arguments)

    // Listen to when the user selects a range
    this.chart.chartCursor.addListener('selected', this.onClick)

    if(_.isEmpty(this.filteredCollection.getFilters())){
      this.$('.toggle-base-collection').hide()
      this.$('.zoom-to-filtered-collection').hide()
    } else {
      this.$('.toggle-base-collection').show()
      this.$('.zoom-to-filtered-collection').show()
    }

  },
  // When the user clicks on a bar in this chart
  onClick: function (e) {
    // console.log('Filtered by', (new Date(e.start)).toISOString(), (new Date(e.end)).toISOString())
    var field = this.collection.getTriggerField()

    var start = new Date(e.start)
    var startIso = trimLastCharacter(start.toISOString())
    var startFriendly = start.toLocaleDateString()

    var end = new Date(e.end)
    var endIso = trimLastCharacter(end.toISOString())
    var endFriendly = end.toLocaleDateString()

    // Trigger the global event handler with this filter
    this.vent.trigger(this.collection.getDataset() + '.filter', {
      field: field,
      expression: {
        type: 'and',
        value: [
          {
            type: '>=',
            value: startIso,
            label: startFriendly
          },
          {
            type: '<=',
            value: endIso,
            label: endFriendly
          }
        ]
      }
    })
  },
    onClickToggleBaseCollectionLink: function (e) {
    var target = $(e.target)
    // If target was the text, change target to the icon
    if(!target.hasClass('toggle-base-collection-icon')){
      target = target.children('.toggle-base-collection-icon')
    }
    // If the toggle is currently on, hide the first graph (base collection)
    if(target.hasClass("fa-toggle-on")){
      this.chart.hideGraph(this.chart.graphs[0])
    } else { 
      this.chart.showGraph(this.chart.graphs[0])
    }
    // No matter what, toggle the icons classes to show the other one
    target.filter('span.fa').toggleClass("fa-toggle-on")
    target.filter('span.fa').toggleClass("fa-toggle-off")
    e.preventDefault()
  }, 
  onClickZoomToFilteredCollectionLink: function (e) {
    var target = $(e.target)
    // If target was the text, change target to the icon
    if(!target.hasClass('zoom-to-filtered-collection-icon')){
      target = target.children('.zoom-to-filtered-collection-icon')
    }

    // If the toggle is currently on, hide the first graph (base collection)
    if(target.hasClass("fa-search-plus")){ // zoom in
      var filteredCollectionValues = _.map(this.filteredCollection.models, function(o){return parseInt(o.attributes.value)})
      var filteredCollectionMaxValue = _.max(filteredCollectionValues) * 1.15 // include some top padding
      this.chart.valueAxes[0].maximum = filteredCollectionMaxValue 
      this.chart.validateNow()
    } else { // zoom out
      var collectionValues = _.map(this.collection.models, function(o){return parseInt(o.attributes.value)})
      var collectionMaxValue = _.max(collectionValues) * 1.15 // include some top padding
      this.chart.valueAxes[0].maximum = collectionMaxValue 
      this.chart.validateNow()
    }

    // No matter what, toggle the icons classes to show the other one
    target.filter('span.fa').toggleClass("fa-search-plus")
    target.filter('span.fa').toggleClass("fa-search-minus")
    e.preventDefault()
  }
})
