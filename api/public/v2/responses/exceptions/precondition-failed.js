const response = require('../response')

class PreconditionFailedHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 412, headers)
    }
}

module.exports = new PreconditionFailedHttpException
