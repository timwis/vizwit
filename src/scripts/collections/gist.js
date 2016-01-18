var _ = require('underscore')
var Backbone = require('backbone')

var model = Backbone.Model.extend({
  idAttribute: 'filename'
})

module.exports = Backbone.Collection.extend({
  model: model,
  initialize: function (models, options) {
    this.options = options || {}
  },
  url: function () {
    return 'https://api.github.com/gists/' + this.options.id
  },
  parse: function (response) {
    return _.values(response.files)
  }
})
