const response = require('./response')

class NoContentResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 200, headers)
  }
}

module.exports = new NoContentResponse
