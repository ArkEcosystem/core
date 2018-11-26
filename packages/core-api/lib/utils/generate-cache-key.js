module.exports = value =>
  require('crypto')
    .createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
