const response = require('../response')

class AccessDeniedHttpException {
    send(res, data, headers = {})
    {
        response.send(res, Object.assign(data, {
            success: false
        }), 403, headers)
    }
}

module.exports = new AccessDeniedHttpException
