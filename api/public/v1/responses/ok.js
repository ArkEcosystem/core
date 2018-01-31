module.exports = (req, res, data, headers = {}) => {
  require('./response').send(req, res, 200, {...data, ...{success: true}}, headers)
}
