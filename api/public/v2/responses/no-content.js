module.exports = (req, res, data, headers = {}) => {
  return require('./response').send(req, res, 204, {data}, headers)
}
