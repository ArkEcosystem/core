const response = require('../response')

class LengthRequiredResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 411)
    }
}

module.exports = new LengthRequiredResponse
