const response = require('../response')

class BadRequestHttpException {
    send(req, res, data, headers = {}) {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 400, headers)
    }
}

module.exports = new BadRequestHttpException
