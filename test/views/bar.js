var fs = require('fs')
var client = require('../helpers/client-env')
var should = require('should')
var Backbone = require('backbone')
var _ = require('underscore')
var underscorify = require('node-underscorify')

require.extensions['.html'] = function(module, filename) {
	var compiler = underscorify.transform({
		templateSettings: {
			variable: 'data'
		}
	})
	var template = compiler(fs.readFileSync(filename, 'utf8').toString())
	console.log('ffff', template)
	return module.exports = template
}

var Socrata = require('../../src/scripts/collections/socrata')
var sampleData = require('../sample-data/business-licenses.json')
var config = {
	"title": "Business Licenses",
	"chartType": "bar",
	"domain": "data.cityofchicago.org",
	"dataset": "xqx5-8hwx",
	"groupBy": "license_type"
}

describe('bar', function() {
	
	before(function() {
		client.setup(function() {
			this.collection = new Socrata(sampleData, config)
			this.filteredCollection = new Socrata(null, config)
			this.vent = _.clone(Backbone.Events)
			this.Bar = require('../../src/scripts/views/bar')
		})
	})
	
	it('initializes', function() {
		/*var view = new this.Bar({
			config: config,
			collection: this.collection,
			filteredCollection: this.filteredCollection,
			vent: this.vent
		})*/
		
		//console.log(view.settings)
	})
	
})