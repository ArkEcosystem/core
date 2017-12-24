const response = require('../response')

class ServiceUnavailableHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 503, headers)
    }
}

module.exports = new ServiceUnavailableHttpException
