module.exports = (data, headers = {}) => {
  require('./response').send(200, {data}, headers)
}
