'use strict';

const path = require('path')

const transformResource = (request, data, transformer) => require(path.resolve(__dirname, `../versions/${request.pre.apiVersion}/transformers/${transformer}`))(data)
const transformCollection = (request, data, transformer) => data.map((d) => transformResource(request, d, transformer))

module.exports = {
  transformResource,
  transformCollection
}
