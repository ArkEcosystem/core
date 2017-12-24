const response = require('../response')

class LengthRequiredResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 411, headers)
  }
}

module.exports = new LengthRequiredResponse
