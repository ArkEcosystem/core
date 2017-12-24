const response = require('./response')

class NoContentResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: true
        }), 204)
    }
}

module.exports = new NoContentResponse
