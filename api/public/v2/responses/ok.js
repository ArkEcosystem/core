const response = require('./response')

class OkResponse {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 200, headers)
    }
}

module.exports = new OkResponse
