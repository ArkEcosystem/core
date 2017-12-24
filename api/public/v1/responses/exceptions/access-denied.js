const response = require('../response')

class AccessDeniedHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 403, headers)
    }
}

module.exports = new AccessDeniedHttpException
