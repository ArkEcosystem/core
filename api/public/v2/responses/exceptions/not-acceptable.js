const response = require('../response')

class NotAcceptableResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 406, headers)
  }
}

module.exports = new NotAcceptableResponse
