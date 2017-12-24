const response = require('../response')

class UnprocessableEntityHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false,
        }), 200, headers)
    }
}

module.exports = new UnprocessableEntityHttpException
