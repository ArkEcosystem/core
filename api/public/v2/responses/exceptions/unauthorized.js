const response = require('../response')

class UnauthorizedHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 401, headers)
    }
}

module.exports = new UnauthorizedHttpException
