const transformResource = require('./transform-resource')

module.exports = (request, data, transformer) => {
  return data.map((d) => transformResource(request, d, transformer))
}
