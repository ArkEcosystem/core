const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 415, headers)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
