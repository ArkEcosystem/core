const response = require('../response')

class MethodNotAllowedResponse {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 405, headers)
    }
}

module.exports = new MethodNotAllowedResponse
