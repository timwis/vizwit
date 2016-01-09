/* global describe, it, before, after */
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var $ = require('jquery')
;require('should')

var sampleData = require('../sample-data/gist.json')

describe('gist', function () {
  before(function () {
    $.ajax = function () {}
    this.stubJquery = sinon.stub($, 'ajax').yieldsTo('success', sampleData)
    var Gist = proxyquire('../../src/scripts/collections/gist', {jquery: this.stubJquery})

    this.gist = new Gist(null, {
      id: 'foo'
    })

    this.gist.fetch()
  })

  it('should request url from id param', function () {
    $.ajax.getCall(0).args[0].url.should.eql('https://api.github.com/gists/foo')
  })

  it('should get correct number of features', function () {
    this.gist.length.should.eql(2)
  })

  it('should be able to parse json', function () {
    (typeof JSON.parse(this.gist.at(0).get('content'))).should.eql('object')
  })

  after(function () {
    $.ajax.restore()
  })
})
