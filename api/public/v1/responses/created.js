module.exports = (data, headers = {}) => {
  require('./response').send(201, Object.assign(data, { success: true }), headers)
}
