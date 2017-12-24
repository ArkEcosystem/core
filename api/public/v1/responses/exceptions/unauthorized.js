const response = require('../response')

class UnauthorizedHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 401, headers)
  }
}

module.exports = new UnauthorizedHttpException
