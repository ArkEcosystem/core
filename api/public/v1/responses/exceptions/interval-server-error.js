const response = require('../response')

class InternalServerErrorHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 500, headers)
    }
}

module.exports = new InternalServerErrorHttpException
