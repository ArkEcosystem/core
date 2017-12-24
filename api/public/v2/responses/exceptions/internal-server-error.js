const response = require('../response')

class InternalServerErrorHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 500)
    }
}

module.exports = new InternalServerErrorHttpException
