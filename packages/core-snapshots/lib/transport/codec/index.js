'use strict'

module.exports = {
  get (codec) {
    switch (codec) {
    case 'ark':
      return require('./ark-codec')
    case 'lite':
      return require('./lite-codec')
    default:
      return 'lite' // msgpack default encoding
    }
  }
}
