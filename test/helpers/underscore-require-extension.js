'use strict';

var fs = require( 'fs' ),
	_ = require( 'underscore' );

var register = module.exports = function() {
	require.extensions['.html'] = function( module, filename ) {
		var content = fs.readFileSync( filename, 'utf8' ),
			compiled = _.template( content );

		return module._compile( compiled, filename );
	};
};

if ( ! module.parent || module.parent.filename.indexOf( __dirname + '/options' ) === -1 ) {
	register();
}