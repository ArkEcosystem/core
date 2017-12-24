const response = require('../response')

class BadRequestHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 400, headers)
    }
}

module.exports = new BadRequestHttpException
