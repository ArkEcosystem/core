module.exports = {
  get(codec) {
    switch (codec) {
      case 'phantom':
        return require('./phantom-codec')
      case 'lite':
        return require('./lite-codec')
      case 'msgpack':
        return null
      default:
        return require('./lite-codec')
    }
  },
}
