const response = require('../response')

class ServiceUnavailableHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 503, headers)
    }
}

module.exports = new ServiceUnavailableHttpException
