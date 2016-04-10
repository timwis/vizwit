var _ = require('underscore')
var deparam = require('node-jquery-deparam')
var Gist = require('./collections/gist')
var split = require('split.js')
var ace = require('brace')
;require('brace/mode/json')
var layout = require('./layout')

var params = window.location.search.substr(1) ? deparam(window.location.search.substr(1)) : {}

var layoutOptions = {
  headerSelector: '#page-header',
  contentSelector: '#page-content'
}

split(['#left', '#preview'], {sizes: [40, 60]})
split(['#docs', '#editor'], {sizes: [5, 95], direction: 'vertical'})

var editor = ace.edit('editor')
var session = editor.getSession()
session.setMode('ace/mode/json')

var setEditorValue = function (obj) {
  editor.setValue(JSON.stringify(obj, null, 2), -1)
}

if (params.gist) {
  (new Gist(null, {id: params.gist})).fetch({
    success: function (collection, response, options) {
      if (!collection.length) return console.error('No files in gist', params.gist)

      // If a file was provided, use that one; otherwise use the first file in the gist
      var model = params.file && collection.get(params.file) ? collection.get(params.file) : collection.at(0)
      var configData = JSON.parse(model.get('content'))
      setEditorValue(configData)
    },
    error: function () {
      console.error('Error fetching gist', params.gist)
    }
  })
} else {
  var configData = require('../data/sample.json')
  setEditorValue(configData)
}

var refresh = function () {
  var input = JSON.parse(editor.getValue())
  layout(input, layoutOptions)
}

session.on('change', _.debounce(refresh, 300))

refresh()
