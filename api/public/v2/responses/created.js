const response = require('./response')

class CreatedResponse {
  send (data, headers = {}) {
    response.send(201, data, headers)
  }
}

module.exports = new CreatedResponse()
