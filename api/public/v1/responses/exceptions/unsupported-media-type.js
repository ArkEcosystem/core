const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 415)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
