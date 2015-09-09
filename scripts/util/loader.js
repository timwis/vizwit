exports.on = function() {
	this.$('.card').fadeTo(1, 0.4);
};

exports.off = function() {
	this.$('.card').fadeTo(1, 1);
}