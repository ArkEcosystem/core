const response = require('../response')

class UnprocessableEntityHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 422, headers)
    }
}

module.exports = new UnprocessableEntityHttpException
