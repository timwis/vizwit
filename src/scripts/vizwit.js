/*eslint no-new:0*/
var _ = require('underscore')
var Backbone = require('backbone')

var Socrata = require('./collections/socrata')
var SocrataFields = require('./collections/socrata-fields')
var GeoJSON = require('./collections/geojson')

var Bar = require('./views/bar')
var Table = require('./views/table')
var DateTime = require('./views/datetime')
var Choropleth = require('./views/choropleth')
var Pie = require('./views/pie')
var Callout = require('./views/callout')

exports.init = function (container, config, opts) {
  // If globals weren't passed, create them within this scope
  opts = opts || {}
  opts.vent = opts.vent || _.clone(Backbone.Events)
  opts.fields = opts.fields || {}

  // Initialize collection
  var collection = new Socrata(null, config)
  var filteredCollection = new Socrata(null, config)

  // If we haven't already created a fields collection for this dataset, create one
  if (opts.fields[config.dataset] === undefined) {
    opts.fields[config.dataset] = new SocrataFields(null, config)
    opts.fields[config.dataset].fetch()
  }

  // Initialize view
  switch (config.chartType) {
    case 'bar':
      new Bar({
        config: config,
        el: container,
        collection: collection,
        filteredCollection: filteredCollection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
    case 'datetime':
      new DateTime({
        config: config,
        el: container,
        collection: collection,
        filteredCollection: filteredCollection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
    case 'pie':
      collection.dontFilterSelf = true
      filteredCollection.dontFilterSelf = true
      new Pie({
        config: config,
        el: container,
        collection: collection,
        filteredCollection: filteredCollection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
    case 'table':
      new Table({
        config: config,
        el: container,
        collection: collection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
    case 'choropleth':
      new Choropleth({
        config: config,
        el: container,
        collection: collection,
        boundaries: new GeoJSON(null, config),
        filteredCollection: filteredCollection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
    case 'callout':
      new Callout({
        config: config,
        el: container,
        collection: collection,
        filteredCollection: filteredCollection,
        fields: opts.fields[config.dataset],
        vent: opts.vent
      })
      break
  }
}
