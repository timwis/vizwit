var should = require('should')
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var $ = require('jquery')
var _ = require('underscore')
var Socrata = require('../../src/scripts/collections/socrata')
var deparam = require('node-jquery-deparam')

var sampleData = require('./sample-data/business-licenses.json')

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true))
}

describe('socrata query builder', function() {
	
	it('should construct base url', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx'
		})
		
		var url = collection.url().split('?')[0]
		url.should.eql('https://data.cityofchicago.org/resource/xqx5-8hwx.json')
	})
	
	it('should construct export url', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx'
		})
		
		var url = collection.exportUrl().split('?')[0]
		url.should.eql('https://data.cityofchicago.org/resource/xqx5-8hwx.csv')
	})
	
	it('should order by :id by default', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$order.should.eql(':id asc')
	})
	
	it('should allow order override', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			order: 'foo desc'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$order.should.eql('foo desc')
	})
	
	it('should paginate', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			limit: 50,
			offset: 100
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$limit.should.eql(50)
		params.$offset.should.eql(100)
	})
	
	it('should free text search', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx'
		})
		
		collection.search = 'foo'
		
		var params = deparam(collection.url().split('?')[1])
		params.$q.should.eql('foo')
	})
	
})

describe('socrata aggregation', function() {
	
	it('should default to count(*) for basic group by', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			groupBy: 'license_type'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$select.should.eql('count(*) as value, license_type as label')
		params.$group.should.eql('license_type')
	})
	
	it('should allow other aggregation functions', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			groupBy: 'license_type',
			aggregateFunction: 'sum',
			aggregateField: 'license_cost'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$select.should.eql('sum(license_cost) as value, license_type as label')
		params.$group.should.eql('license_type')
	})
	
	it('should allow aggregation without group by', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			aggregateFunction: 'sum',
			aggregateField: 'license_cost'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.should.have.property('$select').which.eql('sum(license_cost) as value')
		params.should.not.have.property('$group')
	})
	
	it('should allow override of order when grouping', function() {
		var collection = new Socrata(null, {
			domain: 'data.cityofchicago.org',
			dataset: 'xqx5-8hwx',
			groupBy: 'license_type',
			order: 'label'
		})
		
		var params = deparam(collection.url().split('?')[1])
		params.$select.should.eql('count(*) as value, license_type as label')
		params.$order.should.eql('label asc')
	})
	
})

describe('socrata query filters', function() {
	
	it('should set = filter', function() {
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
		params.$where.should.eql('(license_description = \'foo\')')
	})
	
	it('should set multiple filters', function() {
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
		params.$where.should.eql('(license_description = \'foo\' and application_type = \'bar\')')
	})
	
	it('should set AND filters', function() {
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
		params.$where.should.eql('(code > 1 and code < 3)')
	})
	
	it('should set IN filters', function() {
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
		params.$where.should.eql('(code in (1, 2, 3) and text_code in (\'foo\', \'bar\'))')
	})
	
})

describe('socrata fetch', function() {
	
	before(function() {
		$.ajax = function(){}
		this.stubJquery = sinon.stub($, 'ajax').yieldsTo('success', sampleData)
		var Socrata = proxyquire('../../src/scripts/collections/socrata', {jquery: this.stubJquery})
		
		this.collection = new Socrata(null, {
			"title": "License Description",
			"chartType": "bar",
			"domain": "data.cityofchicago.org",
			"dataset": "xqx5-8hwx",
			"groupBy": "license_description"
		})
		
		this.collection.fetch()
	})
	
	it('should construct url', function() {
		$.ajax.getCall(0).args[0].url.should.eql('https://data.cityofchicago.org/resource/xqx5-8hwx.json?%24select=count(*)%20as%20value%2C%20license_description%20as%20label&%24group=license_description&%24order=value%20desc')
	})
	
	it('should get correct number of features', function() {		
		this.collection.length.should.eql(132)
	})
	
	after(function() {
		$.ajax.restore()
	})
	
})