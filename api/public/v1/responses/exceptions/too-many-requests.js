const response = require('../response')

class TooManyRequestsHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 429, headers)
    }
}

module.exports = new TooManyRequestsHttpException
