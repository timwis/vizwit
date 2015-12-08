var Backbone = require('backbone')
var Template = require('../templates/header.html')

module.exports = Backbone.View.extend({
  initialize: function (options) {
    this.options = options || {}
  },
  render: function () {
    this.$el.append(Template(this.options))
    return this
  }
})
