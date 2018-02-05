const path = require('path')

module.exports = (request, data, transformer) => {
  const transformerClass = path.resolve(__dirname, `../versions/${request.pre.apiVersion}/transformers/${transformer}`)

  return require(transformerClass)(data)
}
