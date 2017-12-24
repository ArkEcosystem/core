const response = require('../response')

class PreconditionRequiredHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 428)
    }
}

module.exports = new PreconditionRequiredHttpException
