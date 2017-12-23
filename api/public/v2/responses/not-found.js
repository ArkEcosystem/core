const response = require('./response')

class NotFoundResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 404)
    }
}

module.exports = new NotFoundResponse
