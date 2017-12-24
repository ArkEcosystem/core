const response = require('../response')

class MethodNotAllowedResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 405)
    }
}

module.exports = new MethodNotAllowedResponse
