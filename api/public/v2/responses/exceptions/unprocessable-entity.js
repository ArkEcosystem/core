const response = require('../response')

class UnprocessableEntityHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 422)
    }
}

module.exports = new UnprocessableEntityHttpException
