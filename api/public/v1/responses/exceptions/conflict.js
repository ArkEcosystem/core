const response = require('../response')

class ConflictHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 409, headers)
  }
}

module.exports = new ConflictHttpException
