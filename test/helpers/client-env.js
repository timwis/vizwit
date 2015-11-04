// From https://github.com/craigspaeth/backbone-headless-testing/
var jsdom = require('jsdom')

exports.setup = function(callback) {
	if(typeof window != 'undefined') return callback(window);
	
  // Setup a jsdom env and globally expose window along with other libraries
  jsdom.env({
    html: '<html><body></body></html>',
    done: function(errs, window) {
      global.window = window;
      /*global.Backbone = require('../../public/javascripts/vendor/backbone.js');
      global.Backbone.$ = global.$ = require('../../public/javascripts/vendor/jquery.js');
      global._ = require('../../public/javascripts/vendor/underscore.js');
      global.App = {};*/
      callback();
    }
  });
}