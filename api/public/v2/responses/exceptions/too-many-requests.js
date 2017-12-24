const response = require('../response')

class TooManyRequestsHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, {
            errors: data
        }, 429, headers)
    }
}

module.exports = new TooManyRequestsHttpException
