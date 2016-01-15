module.exports = {
  socrata: {
    Collection: require('./collections/socrata'),
    Fields: require('./collections/socrata-fields')
  },
  cartodb: {
    Collection: require('./collections/cartodb'),
    Fields: require('./collections/cartodb-fields')
  }
}
