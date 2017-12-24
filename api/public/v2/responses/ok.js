const response = require('./response')

class OkResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 200)
    }
}

module.exports = new OkResponse
