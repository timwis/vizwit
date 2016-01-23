var $ = require('jquery')
var deparam = require('node-jquery-deparam')
var Gist = require('./collections/gist')
var layout = require('./layout')

var params = window.location.search.substr(1) ? deparam(window.location.search.substr(1)) : {}
var pathToFiles = 'data/' // should include trailing slash

// If gist ID specified, fetch it using github's API
if (params.gist) {
  (new Gist(null, {id: params.gist})).fetch({
    success: function (collection, response, options) {
      if (!collection.length) return console.error('No files in gist', params.gist)

      // If a file was provided, use that one; otherwise use the first file in the gist
      var model = params.file && collection.get(params.file) ? collection.get(params.file) : collection.at(0)
      var config = JSON.parse(model.get('content'))

      layout(config)
    },
    error: function () {
      console.error('Error fetching gist', params.gist)
    }
  })
// If file specified, load it from the files directory
} else if (params.file) {
  $.getJSON(pathToFiles + params.file, function (data) {
    layout(data)
  }).fail(function () {
    console.error('Error loading file', params.file)
  })
// If no config specified, redirect to homepage
} else {
  window.location.replace('http://vizwit.io')
}
