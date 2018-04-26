'use strict';

const path = require('path')

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Object}
 */
const transformResource = (request, data, transformer) => require(path.resolve(__dirname, `../versions/${request.pre.apiVersion}/transformers/${transformer}`))(data)

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Object}
 */
const transformCollection = (request, data, transformer) => data.map((d) => transformResource(request, d, transformer))

module.exports = {
  transformResource,
  transformCollection
}
