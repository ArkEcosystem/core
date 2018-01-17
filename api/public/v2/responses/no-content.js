const response = require('./response')

class NoContentResponse {
  send (data, headers = {}) {
    response.send(204, data, headers)
  }
}

module.exports = new NoContentResponse()
