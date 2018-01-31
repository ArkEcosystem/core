module.exports = (req, res, data, headers = {}) => {
  require('./response').send(req, res, 201, {...data, ...{success: true}}, headers)
}
