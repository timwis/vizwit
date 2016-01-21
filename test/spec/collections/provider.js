var test = require('tape')
var BaseFields = require('../../../src/scripts/collections/basefields')
var providers = require('../../../src/scripts/providers')

var sampleFieldsData = require('../../fixtures/fields.json')

for (var i in providers) {
  var Provider = providers[i]

  test('provider: ' + i + ': initialize sets defaults', function (t) {
    t.plan(3)
    var config = {groupBy: 'foo'}
    var provider = new Provider(null, {config: config})
    t.deepEqual(provider.config.baseFilters, [])
    t.deepEqual(provider.config.filters, {})
    t.equal(provider.config.triggerField, 'foo')
  })

  test('provider: ' + i + ': fields collection is instanceof BaseFields', function (t) {
    t.plan(1)
    var provider = new Provider()
    t.ok(provider instanceof BaseFields)
  })

  test('provider: ' + i + ': getRecordCount returns count as promise', function (t) {
    t.plan(2)
    var provider = new Provider()
    provider.recordCount = 50
    var recordCount = provider.getRecordCount()
    t.equal(typeof recordCount.then, 'function')
    recordCount.then(function (total) {
      t.equal(total, 50)
    })
  })

  test('provider: ' + i + ': getFields returns fields as promise', function (t) {
    t.plan(2)
    var config = {dataset: 'foo'}
    var provider = new Provider(null, {config: config})
    var Fields = provider.fieldsCollection
    provider.fieldsCache.foo = new Fields(sampleFieldsData) // give it a preloaded fields collection
    var fields = provider.getFields()
    t.equal(typeof fields.then, 'function')
    fields.then(function (collection) {
      t.equal(collection.length, 2)
    })
  })
}
