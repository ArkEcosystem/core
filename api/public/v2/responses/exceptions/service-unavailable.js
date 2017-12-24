const response = require('../response')

class ServiceUnavailableHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 503)
    }
}

module.exports = new ServiceUnavailableHttpException
