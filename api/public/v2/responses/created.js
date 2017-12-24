const response = require('./response')

class CreatedResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 201)
    }
}

module.exports = new CreatedResponse
