/* eslint max-len: "off" */

const {
  transformResource,
  transformCollection,
} = require('../../utils/transformer')

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginate = request => ({
  offset: request.query.offset || 0,
  limit: request.query.limit || 100,
})

/**
 * Create a hapi.js response.
 * @param  {Object}  data
 * @param  {Boolean} error
 * @return {Object}
 */
const respondWith = (data, error = false) =>
  error ? { error: data, success: false } : { ...data, success: true }

/**
 * Respond with data from cache.
 * @param  {Object} data
 * @param  {Hapi.Toolkit} h
 * @return {Object}
 */
const respondWithCache = (data, h) => {
  const { value, cached } = data
  const lastModified = cached ? new Date(cached.stored) : new Date()

  return value.isBoom
    ? h.response(value.output.payload).code(value.output.statusCode)
    : h.response(value).header('Last-modified', lastModified.toUTCString())
}

/**
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
 */
const toResource = (request, data, transformer) =>
  transformResource(request, data, transformer)

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
 */
const toCollection = transformCollection

/**
 * @type {Object}
 */
module.exports = {
  paginate,
  respondWith,
  respondWithCache,
  toResource,
  toCollection,
}
