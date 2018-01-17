const response = require('./response')

class OkResponse {
  send (data, headers = {}) {
    response.send(200, data, headers)
  }
}

module.exports = new OkResponse()
