const response = require('../response')

class UnsupportedMediaTypeHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 415)
    }
}

module.exports = new UnsupportedMediaTypeHttpException
