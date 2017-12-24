const response = require('../response')

class MethodNotAllowedResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 405)
    }
}

module.exports = new MethodNotAllowedResponse
