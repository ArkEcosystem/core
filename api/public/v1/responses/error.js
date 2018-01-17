const response = require('./response')

class GeneralErrorResponse {
  send (data, headers = {}) {
    response.send(200, Object.assign(data, {
      success: false
    }), headers)
  }
}

module.exports = new GeneralErrorResponse()
