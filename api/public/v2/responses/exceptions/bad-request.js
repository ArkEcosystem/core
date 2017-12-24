const response = require('../response')

class BadRequestHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 400, headers)
  }
}

module.exports = new BadRequestHttpException
