const response = require('../response')

class LengthRequiredResponse {
    send(req, res, data, headers = {})
    {
        response.send(req, res, data, 411, headers)
    }
}

module.exports = new LengthRequiredResponse
