const response = require('../response')

class PreconditionRequiredHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 428, headers)
  }
}

module.exports = new PreconditionRequiredHttpException
