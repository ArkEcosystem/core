module.exports = (req, res, error, headers = {}) => {
  require('./response').send(req, res, 200, {...{error}, ...{success: false}}, headers)
}
