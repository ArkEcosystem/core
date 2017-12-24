const response = require('./response')

class CreatedResponse {
    send(req, res, data, headers = {}) {
        response.send(req, res, data, 201, headers)
    }
}

module.exports = new CreatedResponse
