const response = require('../response')

class LengthRequiredResponse {
    send(res, data, headers = {}) {
        response.send(res, Object.assign(data, {
            success: false
        }), 411, headers)
    }
}

module.exports = new LengthRequiredResponse
