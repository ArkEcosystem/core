const response = require('./response')

class CreatedResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: true
        }), 201)
    }
}

module.exports = new CreatedResponse
