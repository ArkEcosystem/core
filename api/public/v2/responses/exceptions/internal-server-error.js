const response = require('../response')

class InternalServerErrorHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 500, headers)
    }
}

module.exports = new InternalServerErrorHttpException
