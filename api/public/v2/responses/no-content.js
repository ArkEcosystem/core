const response = require('./response')

class NoContentResponse {
    send(res, data, headers = {}) {
        response.send(res, data, 204, headers)
    }
}

module.exports = new NoContentResponse
