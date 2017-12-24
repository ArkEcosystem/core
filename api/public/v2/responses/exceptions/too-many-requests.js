const response = require('../response')

class TooManyRequestsHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 429)
    }
}

module.exports = new TooManyRequestsHttpException
