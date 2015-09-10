var Spinner = require('spin.js');

exports.on = function() {
	this.$('.card').fadeTo(1, 0.4);
	this.spinner = new Spinner().spin(this.el);
};

exports.off = function() {
	this.$('.card').fadeTo(1, 1);
	if(this.spinner) {
		this.spinner.stop();
	}
}