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
    this.template = Template

    _.bindAll(this, 'onClickRemoveFilter')

    // Delegate event here so as not to have it overriden by child classes' events properties
    this.events = _.extend({
      'click .remove-filter': 'onClickRemoveFilter',
      'click .embed-link': 'onClickEmbedLink'
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

    this.collection.getFields().then(function (fieldsCollection) {
      var parsedFilters = _.map(filters, function (filter) {
        var match = fieldsCollection.get(filter.field)
        var fieldName = match ? match.get('title') : filter.field
        return {
          field: filter.field,
          expression: self.parseExpression(fieldName, filter.expression)
        }
      })
      self.$('.filters').empty().append(FiltersTemplate(parsedFilters)).toggle(parsedFilters.length ? true : false) // eslint-disable-line
    })
  },
  parseExpression: function (field, expression) {
    if (expression.type === 'and' || expression.type === 'or') {
      return [
        this.parseExpression(field, expression.value[0]),
        expression.type,
        this.parseExpression(field, expression.value[1])
      ]
    } else {
      return [
        field,
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
  }
})
