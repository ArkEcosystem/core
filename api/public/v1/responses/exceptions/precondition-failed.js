const response = require('../response')

class PreconditionFailedHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 412, headers)
    }
}

module.exports = new PreconditionFailedHttpException
