const response = require('../response')

class PreconditionRequiredHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 428, headers)
    }
}

module.exports = new PreconditionRequiredHttpException
