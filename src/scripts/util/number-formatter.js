module.exports = function (num) {
  var formattedNumber
  var isNegative = false
  if (num < 0) {
    isNegative = true
  }
  num = Math.abs(num)
  if (num >= 1000000000) {
    formattedNumber = (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'g'
  } else if (num >= 1000000) {
    formattedNumber = (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
  } else if (num >= 1000) {
    formattedNumber = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else {
    formattedNumber = num
  }
  if (isNegative) { formattedNumber = '-' + formattedNumber }
  return formattedNumber
}
