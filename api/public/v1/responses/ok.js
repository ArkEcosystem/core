const response = require('./response')

class OkResponse {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: true
    }), 200, headers)
  }
}

module.exports = new OkResponse()
