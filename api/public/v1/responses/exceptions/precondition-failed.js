const response = require('../response')

class PreconditionFailedHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 412, headers)
    }
}

module.exports = new PreconditionFailedHttpException
