const response = require('./response')

class OkResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: true
        }), 200, headers)
    }
}

module.exports = new OkResponse
