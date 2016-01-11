var test = require('tape')
var sinon = require('sinon')
var Backbone = require('backbone')
var _ = require('underscore')
var $ = require('jquery')
var Socrata = require('../../src/scripts/collections/socrata')
var SocrataFields = require('../../src/scripts/collections/socrata-fields')
var Bar = require('../../src/scripts/views/bar')

var sampleData = require('../sample-data/business-licenses.json')

var setup = function () {
  var config = {
    'title': 'Business Licenses',
    'chartType': 'bar',
    'domain': 'data.cityofchicago.org',
    'dataset': 'xqx5-8hwx',
    'groupBy': 'license_description'
  }

  return {
    server: sinon.fakeServer.create(),
    view: new Bar({
      config: config,
      el: $('<div/>', {width: 700, height: 500}).appendTo('body'),
      collection: new Socrata(null, config),
      filteredCollection: new Socrata(null, config),
      fields: new SocrataFields(),
      vent: _.clone(Backbone.Events)
    })
  }
}

var tearDown = function (fixtures) {
  fixtures.server.restore()
}

var respond = function (fixtures, data) {
  fixtures.server.requests[0].respond(
    200,
    {'Content-Type': 'application/json'},
    JSON.stringify(data)
  )
}

test('initializes amchart', function (t) {
  var fixtures = setup()
  respond(fixtures, sampleData)
  t.ok(fixtures.view.chart, 'creates a chart property')
  tearDown(fixtures)
})
