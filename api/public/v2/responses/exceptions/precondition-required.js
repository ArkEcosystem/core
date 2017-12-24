const response = require('../response')

class PreconditionRequiredHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 428)
    }
}

module.exports = new PreconditionRequiredHttpException
