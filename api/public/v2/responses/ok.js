const response = require('./response')

module.exports = (data, headers = {}) => {
  if (data.hasOwnProperty('data')) {
    return response.send(200, data, headers)
  }

  response.send(200, {data}, headers)
}
