const response = require('../response')

class ConflictHttpException {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 409, headers)
    }
}

module.exports = new ConflictHttpException
