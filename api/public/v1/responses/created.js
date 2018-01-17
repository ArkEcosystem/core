const response = require('./response')

class CreatedResponse {
  send (data, headers = {}) {
    response.send(201, Object.assign(data, {
      success: true
    }), headers)
  }
}

module.exports = new CreatedResponse()
