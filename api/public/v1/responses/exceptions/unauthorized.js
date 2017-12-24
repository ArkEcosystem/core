const response = require('../response')

class UnauthorizedHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 401, headers)
    }
}

module.exports = new UnauthorizedHttpException
