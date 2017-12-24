const response = require('../response')

class TooManyRequestsHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 429, headers)
    }
}

module.exports = new TooManyRequestsHttpException
