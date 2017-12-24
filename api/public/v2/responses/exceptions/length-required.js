const response = require('../response')

class LengthRequiredResponse {
    send(res, data, headers = {}) {
        response.send(res, {
            errors: data
        }, 411, headers)
    }
}

module.exports = new LengthRequiredResponse
