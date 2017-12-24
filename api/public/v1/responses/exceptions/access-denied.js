const response = require('../response')

class AccessDeniedHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 403)
    }
}

module.exports = new AccessDeniedHttpException
