module.exports = (data, headers = {}) => {
  require('./response').send(204, data, headers)
}
