var _ = require('underscore')
var split = require('split.js')
var ace = require('brace')
;require('brace/mode/json')
var layout = require('./layout')

split(['#editor', '#preview'], {sizes: [40, 60]})

var editor = ace.edit('editor')
var session = editor.getSession()
session.setMode('ace/mode/json')

var refresh = function () {
  var input = JSON.parse(editor.getValue())
  layout(input)
}

session.on('change', _.debounce(refresh, 300))

refresh()