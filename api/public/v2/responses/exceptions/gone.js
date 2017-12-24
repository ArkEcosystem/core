const response = require('../response')

class GoneHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, data, 410, headers)
    }
}

module.exports = new GoneHttpException
