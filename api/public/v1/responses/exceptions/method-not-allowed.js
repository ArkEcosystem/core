const response = require('../response')

class MethodNotAllowedResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 405, headers)
    }
}

module.exports = new MethodNotAllowedResponse
