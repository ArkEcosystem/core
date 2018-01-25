module.exports = (data, headers = {}) => {
  require('./response').send(200, {...data, ...{success: true}}, headers)
}
