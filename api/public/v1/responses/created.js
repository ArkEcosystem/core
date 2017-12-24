const response = require('./response')

class CreatedResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: true
        }), 201, headers)
    }
}

module.exports = new CreatedResponse
