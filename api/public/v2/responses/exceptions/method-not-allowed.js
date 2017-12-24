const response = require('../response')

class MethodNotAllowedResponse {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 405, headers)
    }
}

module.exports = new MethodNotAllowedResponse
