const response = require('../response')

class PreconditionFailedHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 412)
    }
}

module.exports = new PreconditionFailedHttpException
