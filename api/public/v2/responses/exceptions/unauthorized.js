const response = require('../response')

class UnauthorizedHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 401, headers)
  }
}

module.exports = new UnauthorizedHttpException
