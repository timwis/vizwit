module.exports = function (data, key, val) {
  return data.reduce(function (hash, item) {
    if (item[key]) {
      hash[item[key]] = isNaN(item[val]) ? null : +item[val]
    }
    return hash
  }, {})
}
