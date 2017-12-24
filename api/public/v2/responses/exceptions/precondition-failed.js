const response = require('../response')

class PreconditionFailedHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, {
            errors: data
        }, 412, headers)
    }
}

module.exports = new PreconditionFailedHttpException
