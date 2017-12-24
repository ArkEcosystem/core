const response = require('../response')

class BadRequestHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 400, headers)
    }
}

module.exports = new BadRequestHttpException
