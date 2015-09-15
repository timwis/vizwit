var Spinner = require('spin.js');

exports.on = function() {
	// Fade out panel
	this.$('.viz').fadeTo(1, 0.4);
	
	// Create the spinner if it doesn't exist yet
	if( ! this.spinner) {
		this.spinner = new Spinner();
	}
	
	// Start the spinner
	this.spinner.spin(this.el);
};

exports.off = function() {
	// Fade in panel
	this.$('.viz').fadeTo(1, 1);
	
	// Stop the spinner
	if(this.spinner) {
		this.spinner.stop();
	}
}