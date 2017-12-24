const response = require('./response')

class NoContentResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 204)
    }
}

module.exports = new NoContentResponse
