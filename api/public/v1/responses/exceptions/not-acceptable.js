const response = require('../response')

class NotAcceptableResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: false
        }), 406)
    }
}

module.exports = new NotAcceptableResponse
