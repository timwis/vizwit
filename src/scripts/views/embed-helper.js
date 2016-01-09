var Backbone = require('backbone')
var Template = require('../templates/embed-helper.html')
var Clipboard = require('clipboard')
require('backbone.modal/backbone.modal')

module.exports = Backbone.Modal.extend({
  template: Template,
  cancelEl: '.cancel',
  onShow: function () {
    new Clipboard('.copy') // eslint-disable-line
  }
})
