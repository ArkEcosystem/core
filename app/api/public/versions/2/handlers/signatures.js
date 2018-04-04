const Boom = require('boom')
const schema = require('../schema/signatures')

exports.index = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}
