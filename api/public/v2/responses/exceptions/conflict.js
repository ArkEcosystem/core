const response = require('../response')

class ConflictHttpException {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 409, headers)
    }
}

module.exports = new ConflictHttpException
