const response = require('../response')

class NotAcceptableResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 406, headers)
    }
}

module.exports = new NotAcceptableResponse
