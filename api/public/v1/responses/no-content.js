const response = require('./response')

class NoContentResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: true
        }), 204, headers)
    }
}

module.exports = new NoContentResponse
