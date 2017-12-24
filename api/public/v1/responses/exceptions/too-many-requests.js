const response = require('../response')

class TooManyRequestsHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 429, headers)
    }
}

module.exports = new TooManyRequestsHttpException
