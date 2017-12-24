const response = require('../response')

class AccessDeniedHttpException {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 403, headers)
    }
}

module.exports = new AccessDeniedHttpException
