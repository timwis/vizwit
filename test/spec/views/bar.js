var test = require('tape')
var sinon = require('sinon')
var $ = require('jquery')
var Socrata = require('../../../src/scripts/collections/socrata')
var Bar = require('../../../src/scripts/views/bar')

var sampleData = require('../../fixtures/business-licenses.json')

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
      collection: new Socrata(null, {config: config}),
      filteredCollection: new Socrata(null, {config: config})
    })
  }
}

var tearDown = function (fixtures) {
  fixtures.server.restore()
}

var respond = function (server, data) {
  server.respond([
    200,
    {'Content-Type': 'application/json'},
    JSON.stringify(data)
  ])
}

test('bar: initializes amchart', function (t) {
  t.plan(1)
  var fixtures = setup()
  respond(fixtures.server, sampleData)
  t.ok(fixtures.view.chart, 'creates a chart property')
  tearDown(fixtures)
})
