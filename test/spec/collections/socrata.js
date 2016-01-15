var test = require('tape')
var sinon = require('sinon')
var deparam = require('node-jquery-deparam')
var Socrata = require('../../../src/scripts/collections/socrata')

var sampleData = require('../../fixtures/business-licenses.json')

var setup = function () {
  return {
    server: sinon.fakeServer.create()
  }
}

var respond = function (server, data) {
  server.respond([
    200,
    {'Content-Type': 'application/json'},
    JSON.stringify(data)
  ])
}

/**
 * Query builder
 */
test('socrata: query: should construct base url', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  var url = collection.url().split('?')[0]
  t.equal(url, 'https://data.cityofchicago.org/resource/xqx5-8hwx.json')
})

test('socrata: query: should construct export url', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  var url = collection.exportUrl().split('?')[0]
  t.equal(url, 'https://data.cityofchicago.org/resource/xqx5-8hwx.csv', 'csv suffix')
})

test('socrata: query: should order by :id by default', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$order, ':id asc')
})

test('socrata: query: should allow order override', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    order: 'foo desc'
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$order, 'foo desc')
})

test('socrata: query: should paginate', function (t) {
  t.plan(2)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    limit: 50,
    offset: 100
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$limit, 50)
  t.equal(params.$offset, 100)
})

test('socrata: query: should free text search', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  collection.setSearch('foo')

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$q, 'foo')
})

/**
 * Aggregation
 */
test('socrata: aggregation: should default to count(*) for basic group by', function (t) {
  t.plan(2)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    groupBy: 'license_type'
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$select, 'count(*) as value, license_type as label')
  t.equal(params.$group, 'license_type')
})

test('socrata: aggregation: should allow other aggregation functions', function (t) {
  t.plan(2)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    groupBy: 'license_type',
    aggregateFunction: 'sum',
    aggregateField: 'license_cost'
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$select, 'sum(license_cost) as value, license_type as label')
  t.equal(params.$group, 'license_type')
})

test('socrata: aggregation: should allow aggregation without group by', function (t) {
  t.plan(3)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    aggregateFunction: 'sum',
    aggregateField: 'license_cost'
  })

  var params = deparam(collection.url().split('?')[1])
  t.ok(params.$select, 'should have $select property')
  t.equal(params.$select, 'sum(license_cost) as value')
  t.notOk(params.$group, 'should not have $group property')
})

test('socrata: aggregation: should allow override of order when grouping', function (t) {
  t.plan(2)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx',
    groupBy: 'license_type',
    order: 'label'
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$select, 'count(*) as value, license_type as label')
  t.equal(params.$order, 'label asc')
})

/**
 * Query filters
 */
test('socrata: filters: should set = filter', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  collection.setFilter({
    field: 'license_description',
    expression: {
      'type': '=',
      value: 'foo'
    }
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$where, "(license_description = 'foo')")
})

test('socrata: filters: should set multiple filters', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  collection.setFilter({
    field: 'license_description',
    expression: {
      'type': '=',
      value: 'foo'
    }
  })

  collection.setFilter({
    field: 'application_type',
    expression: {
      'type': '=',
      value: 'bar'
    }
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$where, "(license_description = 'foo' and application_type = 'bar')")
})

test('socrata: filters: should set AND filters', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  collection.setFilter({
    field: 'code',
    expression: {
      'type': 'and',
      value: [
        {
          'type': '>',
          value: 1
        },
        {
          'type': '<',
          value: 3
        }
      ]
    }
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$where, '(code > 1 and code < 3)')
})

test('socrata: filters: should set IN filters', function (t) {
  t.plan(1)
  var collection = new Socrata(null, {
    domain: 'data.cityofchicago.org',
    dataset: 'xqx5-8hwx'
  })

  collection.setFilter({
    field: 'code',
    expression: {
      'type': 'in',
      value: [1, 2, 3]
    }
  })

  collection.setFilter({
    field: 'text_code',
    expression: {
      'type': 'in',
      value: ['foo', 'bar']
    }
  })

  var params = deparam(collection.url().split('?')[1])
  t.equal(params.$where, "(code in (1, 2, 3) and text_code in ('foo', 'bar'))")
})

/**
 * Fetch
 */
test('socrata: fetch: should get correct number of features', function (t) {
  t.plan(1)
  var fixtures = setup()
  var collection = new Socrata(null, {
    'title': 'License Description',
    'chartType': 'bar',
    'domain': 'data.cityofchicago.org',
    'dataset': 'xqx5-8hwx',
    'groupBy': 'license_description'
  })
  collection.fetch()
  respond(fixtures.server, sampleData)
  t.equal(collection.length, 132)
})

/* it('should construct record count url', function() {
  this.collection.getRecordCount()
  console.log($.ajax.getCall(1).args[0].url)
})*/

