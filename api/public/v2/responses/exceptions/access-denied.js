const response = require('../response')

class AccessDeniedHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 403)
    }
}

module.exports = new AccessDeniedHttpException
