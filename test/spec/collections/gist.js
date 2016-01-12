var test = require('tape')
var sinon = require('sinon')
var Gist = require('../../../src/scripts/collections/gist')

var sampleData = require('../../fixtures/gist.json')

var setup = function () {
  return {
    server: sinon.fakeServer.create(),
    collection: new Gist(null, { id: 'foo' })
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

test('gist: should request url from id param', function (t) {
  t.plan(1)
  var fixtures = setup()
  fixtures.collection.fetch()
  t.equal(fixtures.server.requests[0].url, 'https://api.github.com/gists/foo')
  tearDown()
})

test('gist: should get correct number of features', function (t) {
  t.plan(1)
  var fixtures = setup()
  fixtures.collection.fetch()
  respond(fixtures.server, sampleData)
  t.equal(fixtures.collection.length, 2, 'length is 2')
  tearDown()
})
