const response = require('./response')

class CreatedResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: true
    }), 201, headers)
  }
}

module.exports = new CreatedResponse
