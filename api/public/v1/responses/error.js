module.exports = (error, headers = {}) => {
  require('./response').send(200, {...{error}, ...{success: false}}, headers)
}
