const response = require('./response')

class OkResponse {
    send(res, data, headers = {}) {
        response.send(res, data, 200, headers)
    }
}

module.exports = new OkResponse
