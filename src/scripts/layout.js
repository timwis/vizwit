var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')

var Header = require('./views/header')
var vizwit = require('./vizwit')

var vent = _.clone(Backbone.Events)
var fieldsCache = {}

module.exports = function (config, options) {
  options = options || {}
  if (!config.version || config.version !== '2') console.error('Wrong config version')

  // Render header
  if (config.header) {
    var header = new Header(config.header)
    $(options.headerSelector).empty().append(header.render().el)

    // Update <title> tag
    if (config.header.title) {
      var originalTitle = $('title').text()
      $('title').text(config.header.title + ' - ' + originalTitle)
    }
  }

  var container = $(options.contentSelector)
  var heightInterval = 60 // from gridstack.js
  var current = {x: null, y: null}
  var row

  container.empty()

  config.cards.forEach(function (config) {
    // If y suggests we're on a new row (including the first item), create a new row
    if (config.y !== current.y) {
      row = $('<div class="row"></div>')
      container.append(row)
      current.y = config.y
      current.x = 0
    }

    var column = $('<div/>')

    // Add width class
    column.addClass('col-sm-' + config.width)

    // If x is not the same as our current x position, add offset class
    if (config.x !== current.x) {
      column.addClass('col-sm-offset-' + (config.x - current.x))
    }
    // Set height of new div
    column.css('min-height', config.height * heightInterval)

    // Increment current.x to new starting position
    current.x += config.width

    // Add the div to the current row
    row.append(column)

    // Initialize vizwit on new div
    vizwit.init(column, config.vizwit, {
      vent: vent,
      fieldsCache: fieldsCache
    })
  })
}
