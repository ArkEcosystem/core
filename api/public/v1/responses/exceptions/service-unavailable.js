const response = require('../response')

class ServiceUnavailableHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 503, headers)
    }
}

module.exports = new ServiceUnavailableHttpException
