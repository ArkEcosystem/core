const response = require('../response')

class NotAcceptableResponse {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 406, headers)
    }
}

module.exports = new NotAcceptableResponse
