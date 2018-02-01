const path = require('path')

module.exports = (request, data, transformer) => {
  return require(path.resolve(__dirname, `../versions/${request.pre.apiVersion}/transformers/${transformer}`))(data)
}
