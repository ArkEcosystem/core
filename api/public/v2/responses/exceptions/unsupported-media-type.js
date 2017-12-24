const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 415, headers)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
