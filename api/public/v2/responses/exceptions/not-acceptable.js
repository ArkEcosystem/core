const response = require('../response')

class NotAcceptableResponse {
    send(req, res, data)
    {
        response.send(req, res, data, 406)
    }
}

module.exports = new NotAcceptableResponse
