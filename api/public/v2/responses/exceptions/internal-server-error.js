const response = require('../response')

class InternalServerErrorHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 500, headers)
  }
}

module.exports = new InternalServerErrorHttpException
