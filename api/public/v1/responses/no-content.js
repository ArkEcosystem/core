const response = require('./response')

class NoContentResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: true
    }), 204, headers)
  }
}

module.exports = new NoContentResponse()
