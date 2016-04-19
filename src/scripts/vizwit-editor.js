var _ = require('underscore')
var split = require('split.js')
var ace = require('brace')
;require('brace/mode/json')
var layout = require('./layout')

var sampleData = require('../data/sample.json')

var layoutOptions = {
  headerSelector: '#page-header',
  contentSelector: '#page-content'
}

split(['#left', '#preview'], {sizes: [40, 60]})
split(['#docs', '#editor'], {sizes: [5, 95], direction: 'vertical'})

var editor = ace.edit('editor')
var session = editor.getSession()
session.setMode('ace/mode/json')
editor.setValue(JSON.stringify(sampleData, null, 2), -1)

var refresh = function () {
  var input = JSON.parse(editor.getValue())
  layout(input, layoutOptions)
}

session.on('change', _.debounce(refresh, 300))

refresh()
