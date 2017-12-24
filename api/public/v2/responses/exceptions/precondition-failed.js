const response = require('../response')

class PreconditionFailedHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 412, headers)
    }
}

module.exports = new PreconditionFailedHttpException
