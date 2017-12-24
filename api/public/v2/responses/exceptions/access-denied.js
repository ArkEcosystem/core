const response = require('../response')

class AccessDeniedHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 403, headers)
    }
}

module.exports = new AccessDeniedHttpException
