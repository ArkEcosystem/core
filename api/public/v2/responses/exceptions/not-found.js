const response = require('../response')

class NotFoundHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, {
      errors: data
    }, 404, headers)
  }
}

module.exports = new NotFoundHttpException
