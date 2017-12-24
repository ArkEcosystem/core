const response = require('../response')

class PreconditionRequiredHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 428, headers)
  }
}

module.exports = new PreconditionRequiredHttpException
