const response = require('../response')

class NotAcceptableResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 406, headers)
  }
}

module.exports = new NotAcceptableResponse
