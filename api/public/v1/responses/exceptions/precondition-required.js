const response = require('../response')

class PreconditionRequiredHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 428, headers)
    }
}

module.exports = new PreconditionRequiredHttpException
