var test = require('tape')
var sinon = require('sinon')
var GeoJSON = require('../../../src/scripts/collections/geojson')

var sampleData = require('../../fixtures/rectangles.json')

var setup = function () {
  return {
    server: sinon.fakeServer.create(),
    collection: new GeoJSON(null, { boundaries: 'foo' })
  }
}

var tearDown = function () {}

var respond = function (server, data) {
  server.respond([
    200,
    {'Content-Type': 'application/json'},
    JSON.stringify(data)
  ])
}

test('geojson: should request url from boundaries param', function (t) {
  t.plan(1)
  var fixtures = setup()
  fixtures.collection.fetch()
  t.equal(fixtures.server.requests[0].url, 'foo')
  tearDown()
})

test('geojson: should get correct number of features', function (t) {
  t.plan(1)
  var fixtures = setup()
  fixtures.collection.fetch()
  respond(fixtures.server, sampleData)
  t.equal(fixtures.collection.length, 2, 'length is 2')
  tearDown()
})

test('geojson: should output geojson', function (t) {
  t.plan(2)
  var fixtures = setup()
  fixtures.collection.fetch()
  respond(fixtures.server, sampleData)
  var outGeoJSON = fixtures.collection.toGeoJSON()
  t.equal(outGeoJSON.type, 'FeatureCollection', 'should have "type" property with value "FeatureCollection"')
  t.equal(outGeoJSON.features.length, 2, 'should have "features" property with length of 2')
})
