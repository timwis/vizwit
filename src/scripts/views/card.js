var $ = jQuery = require('jquery') // eslint-disable-line
var _ = require('underscore')
var Backbone = require('backbone')
var Template = require('../templates/card.html')
var FiltersTemplate = require('../templates/filters.html')
var EmbedHelperView = require('./embed-helper')
require('bootstrap/js/dropdown')
require('bootstrap/js/modal')

var operatorMap = {
  '=': 'is',
  '>': 'is greater than',
  '>=': 'is greater than or equal to',
  '<': 'is less than',
  '<=': 'is less than or equal to',
  'not in': 'is not'
}

module.exports = Backbone.View.extend({
  initialize: function (options) {
    options = options || {}
    this.config = options.config || {}
    this.fields = options.fields || {}
    this.template = Template

    _.bindAll(this, 'onClickRemoveFilter')

    // Delegate event here so as not to have it overriden by child classes' events properties
    this.events = _.extend({
      'click .remove-filter': 'onClickRemoveFilter',
      'click .embed-link': 'onClickEmbedLink',
      'click .expand-card': 'onClickExpandLink'
    }, this.events || {})
    this.delegateEvents()

    // Render template
    this.$el.addClass(this.config.chartType)
    this.renderTemplate()
    this.setHeight()

    // Set export link
    this.updateExportLink()

    // Watch for collection sync and update export link
    if (options.collection) this.listenTo(options.collection, 'sync', this.updateExportLink)
    if (options.filteredCollection) this.listenTo(options.filteredCollection, 'sync', this.updateExportLink)
  },
  renderTemplate: function () {
    this.$el.empty().append(this.template(this.config))
  },
  setHeight: function () {
    var availableHeight = this.$el.height()
    this.$('.card').css('min-height', availableHeight)

    // Set .card-content height to the available height in its container
    var cardContent = this.$('.card-content')
    $.each(cardContent.siblings(), function () {
      availableHeight -= $(this).height()
    })
    cardContent.css('min-height', availableHeight)
  },
  renderFilters: function () {
    var self = this
    var filters = this.filteredCollection ? this.filteredCollection.getFilters() : this.collection.getFilters()

    var parsedFilters = _.map(filters, function (filter) {
      return {
        field: filter.field,
        expression: self.parseExpression(filter.field, filter.expression)
      }
    })
    this.$('.filters').empty().append(FiltersTemplate(parsedFilters)).toggle(parsedFilters.length ? true : false) // eslint-disable-line
  },
  parseExpression: function (field, expression) {
    if (expression.type === 'and' || expression.type === 'or') {
      return [
        this.parseExpression(field, expression.value[0]),
        expression.type,
        this.parseExpression(field, expression.value[1])
      ]
    } else {
      var match = this.fields.get(field)
      return [
        match ? match.get('title') : field,
        operatorMap[expression.type] || expression.type,
        expression.label || expression.value
      ]
    }
  },
  onClickRemoveFilter: function (e) {
    var filter = $(e.currentTarget).data('filter')
    if (filter) {
      this.vent.trigger(this.collection.getDataset() + '.filter', {
        field: filter
      })
    }
    e.preventDefault()
  },
  updateExportLink: function (collection) {
    collection = collection || this.collection
    this.$('.export-link').attr('href', collection.exportUrl())
  },
  onClickEmbedLink: function (e) {
    var exportView = new EmbedHelperView({model: new Backbone.Model(this.config)})
    this.$el.after(exportView.render().el)
    e.preventDefault()
  },
  onClickExpandLink: function (e) {
    var card_el = this.$el
    if (card_el.attr("data-expanded") == "true") {
      // Contract card height
      card_el.attr("style",card_el.attr("data-original-styles"))
      card_el.css("min-height",card_el.attr("data-original-min-height"))
      card_el.height(card_el.attr("data-original-height")-15) // not sure why I need to make this smaller than it was
      // Contract card width
      var originalClasses = card_el.attr("data-original-classes")
      card_el.addClass("col-sm-12")
      card_el.attr("data-original-classes","")
      card_el.attr("class",originalClasses)
      // Set state as not expanded
      card_el.attr("data-expanded","false")
    } else { 
      // Expand width
      var originalClasses = card_el.attr("class")
      card_el.attr("data-original-classes",originalClasses)
      card_el.removeClass(originalClasses)
      card_el.addClass("col-sm-12")
      // Expand height
      card_el.attr("data-original-styles",card_el.attr("style"))
      card_el.attr("data-original-height",card_el.height())
      card_el.attr("data-original-min-height",card_el.css("min-height"))
      card_el.css("min-height",parseInt(card_el.css("min-height")*1.5)+"px")
      // Set state as expanded
      card_el.attr("data-expanded","true")
    }
    this.setHeight()
    if (this.config.chartType == "choropleth") {
      // Leaflet maps need to be refreshed upon container size change
      this.map.invalidateSize()
    }
    e.preventDefault()
  }
})
