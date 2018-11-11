const processor = require('./services/processor')

module.exports = {
  method: 'POST',
  path: '/',
  async handler(request, h) {
    return Array.isArray(request.payload)
      ? processor.collection(request.server, request.payload)
      : processor.resource(request.server, request.payload)
  },
}
