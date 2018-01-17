module.exports = (data, headers = {}) => {
  require('./response').send(201, data, headers)
}
