module.exports = (error, headers = {}) => {
  require('./response').send(200, Object.assign({error}, { success: false }), headers)
}
