module.exports = (req, res, data, headers = {}) => {
  return require('./response').send(req, res, 201, {data}, headers)
}
