const response = require('../response')

class UnprocessableEntityHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 422)
    }
}

module.exports = new UnprocessableEntityHttpException
