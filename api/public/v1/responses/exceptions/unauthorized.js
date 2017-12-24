const response = require('../response')

class UnauthorizedHttpException {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 401)
    }
}

module.exports = new UnauthorizedHttpException
