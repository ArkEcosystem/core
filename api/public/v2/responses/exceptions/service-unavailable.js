const response = require('../response')

class ServiceUnavailableHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, {
            errors: data
        }, 503, headers)
    }
}

module.exports = new ServiceUnavailableHttpException
