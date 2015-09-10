var chroma = require('chroma-js');

function ColorRange(colors, min, max) {
	this.colors = colors;
	this.min = min;
	this.max = max;
	this.colorScale = chroma.scale(chroma.bezier(this.colors)).mode('lab').correctLightness(true);
}

ColorRange.prototype.getColor = function(needle) {
	var normalized = ( (needle - this.min) / (this.max - this.min) ) * this.colors.length;
	return this.colorScale(normalized).hex();
}

module.exports = ColorRange;