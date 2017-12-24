const response = require('../response')

class LengthRequiredResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 411)
    }
}

module.exports = new LengthRequiredResponse
