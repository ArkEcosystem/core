const response = require('../response')

class NotFoundHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 404, headers)
    }
}

module.exports = new NotFoundHttpException
