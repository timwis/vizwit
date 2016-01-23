var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var vizwit = require('./vizwit')

var vent = _.clone(Backbone.Events)
var fieldsCache = {}

$(document).ready(function () {
  $('script.vizwit').each(function (scriptTag) {
    var config = JSON.parse($(this).html())
    vizwit.init($(this).parent(), config, {
      vent: vent,
      fieldsCache: fieldsCache
    })
  })
})
