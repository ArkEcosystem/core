const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, {
            errors: data
        }, 415, headers)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
