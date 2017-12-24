const response = require('../response')

class GoneHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 410, headers)
    }
}

module.exports = new GoneHttpException
