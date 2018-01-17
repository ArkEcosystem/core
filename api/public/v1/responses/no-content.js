module.exports = (data, headers = {}) => {
  require('./response').send(204, Object.assign(data, { success: true }), headers)
}
