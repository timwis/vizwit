var chroma = require('chroma-js');
var tinygradient = require('tinygradient');

function ColorRange(startColor, endColor, steps, min, max) {
	this.gradient = tinygradient([startColor, endColor]);
	this.min = min;
	this.max = max;
	this.colors = this.gradient.rgb(steps).map(function(color) { return '#' + color.toHex(); });
	this.colorScale = chroma.scale((this.colors)).mode('lab').correctLightness(true);
}

ColorRange.prototype.getColor = function(needle) {
	var normalized = ( (needle - this.min) / (this.max - this.min) ) * (this.colors.length - 1);
	return this.colorScale(normalized).hex();
	//return this.colors[Math.round(normalized)];
}

module.exports = ColorRange;