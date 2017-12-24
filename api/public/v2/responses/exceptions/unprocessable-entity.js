const response = require('../response')

class UnprocessableEntityHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 422, headers)
    }
}

module.exports = new UnprocessableEntityHttpException
