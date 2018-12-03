/* eslint max-len: "off" */

const path = require('path')

/**
 * Transform the given data to a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Object}
 */
const transformResource = (request, data, transformer) =>
  require(path.resolve(
    __dirname,
    `../versions/${request.pre.apiVersion}/transformers/${transformer}`,
  ))(data)

/**
 * Transform the given data to a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Object}
 */
const transformCollection = (request, data, transformer) =>
  data.map(d => transformResource(request, d, transformer))

/**
 * @type {Object}
 */
module.exports = {
  transformResource,
  transformCollection,
}
