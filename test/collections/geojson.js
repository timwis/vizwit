/* global describe, it, before, after */
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var $ = require('jquery')
;require('should')

var sampleData = require('../sample-data/rectangles.json')

describe('geojson', function () {
  before(function () {
    $.ajax = function () {}
    this.stubJquery = sinon.stub($, 'ajax').yieldsTo('success', sampleData)
    var GeoJSON = proxyquire('../../src/scripts/collections/geojson', {jquery: this.stubJquery})

    this.geojson = new GeoJSON(null, {
      boundaries: 'foo'
    })

    this.geojson.fetch()
  })

  it('should request url from boundaries param', function () {
    $.ajax.getCall(0).args[0].url.should.eql('foo')
  })

  it('should get correct number of features', function () {
    this.geojson.length.should.eql(2)
  })

  it('should output geojson', function () {
    var outGeoJSON = this.geojson.toGeoJSON()
    outGeoJSON['type'].should.eql('FeatureCollection')
    outGeoJSON.features.length.should.eql(2)
  })

  after(function () {
    $.ajax.restore()
  })
})
