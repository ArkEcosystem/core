const response = require('../response')

class NotFoundHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 404, headers)
    }
}

module.exports = new NotFoundHttpException
