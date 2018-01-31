const response = require('./response')

module.exports = (req, res, data, headers = {}) => {
  return data.hasOwnProperty('data')
    ? response.send(req, res, 200, data, headers)
    : response.send(req, res, 200, {data}, headers)
}
