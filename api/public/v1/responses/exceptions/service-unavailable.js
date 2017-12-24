const response = require('../response')

class ServiceUnavailableHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false
    }), 503, headers)
  }
}

module.exports = new ServiceUnavailableHttpException
