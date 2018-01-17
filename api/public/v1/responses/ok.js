module.exports = (data, headers = {}) => {
  require('./response').send(200, Object.assign(data, { success: true }), headers)
}
