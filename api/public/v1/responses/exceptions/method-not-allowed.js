const response = require('../response')

class MethodNotAllowedResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 405, headers)
  }
}

module.exports = new MethodNotAllowedResponse
