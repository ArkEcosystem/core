const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 415, headers)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
