const response = require('./response')

class OkResponse {
    send(req, res, data)
    {
        response.send(req, res, Object.assign(data, {
            success: true
        }), 200)
    }
}

module.exports = new OkResponse
