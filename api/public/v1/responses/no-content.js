const response = require('./response')

class NoContentResponse {
  send (data, headers = {}) {
    response.send(204, Object.assign(data, {
      success: true
    }), headers)
  }
}

module.exports = new NoContentResponse()
