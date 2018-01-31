const utils = require('../utils')

const index = (req, res, next) => {
  utils
    .respondWith(req, res, 'notImplemented', 'Method has not yet been implemented.')
    .then(() => next())
}

module.exports = {
  index
}
