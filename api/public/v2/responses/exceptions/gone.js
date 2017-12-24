const response = require('../response')

class GoneHttpException {
    send(res, data, headers = {}) {
        response.send(res, data, 410, headers)
    }
}

module.exports = new GoneHttpException
