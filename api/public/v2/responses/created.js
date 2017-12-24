const response = require('./response')

class CreatedResponse {
    send(res, data, headers = {}) {
        response.send(res, data, 201, headers)
    }
}

module.exports = new CreatedResponse
