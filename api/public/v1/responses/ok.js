const response = require('./response')

class OkResponse {
  send (data, headers = {}) {
    response.send(200, Object.assign(data, {
      success: true
    }), headers)
  }
}

module.exports = new OkResponse()
