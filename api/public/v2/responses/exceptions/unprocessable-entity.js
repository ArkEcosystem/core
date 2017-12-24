const response = require('../response')

class UnprocessableEntityHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 422, headers)
  }
}

module.exports = new UnprocessableEntityHttpException
