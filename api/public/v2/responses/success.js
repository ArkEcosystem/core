const response = require('./response')

class SuccessResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 200)
    }
}

module.exports = new SuccessResponse
