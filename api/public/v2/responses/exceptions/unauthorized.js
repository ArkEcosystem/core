const response = require('../response')

class UnauthorizedHttpException {
    send(req, res, data)
    {
        response.send(req, res, data, 401)
    }
}

module.exports = new UnauthorizedHttpException
