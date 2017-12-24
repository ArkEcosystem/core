const response = require('../response')

class ServiceUnavailableHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 503)
    }
}

module.exports = new ServiceUnavailableHttpException
