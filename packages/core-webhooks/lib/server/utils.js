'use strict'

const Boom = require('boom')

/**
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Object}
 */
const transformResource = (request, data) => {
  return require('./transformer')(data)
}

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Array}
 */
const transformCollection = (request, data, transformer) => {
  return data.map((d) => transformResource(request, d, transformer))
}

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit
  }
}

/**
 * Respond with a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Hapi.Response}
 */
const respondWithResource = (request, data, transformer) => {
  return data
    ? { data: transformResource(request, data, transformer) }
    : Boom.notFound()
}

/**
 * Respond with a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
 */
const respondWithCollection = (request, data, transformer) => {
  return { data: transformCollection(request, data, transformer) }
}

/**
 * Alias of "transformResource".
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Hapi.Response}
 */
const toResource = (request, data, transformer) => {
  return transformResource(request, data, transformer)
}

/**
 * Alias of "transformCollection".
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Hapi.Response}
 */
const toCollection = (request, data, transformer) => {
  return transformCollection(request, data, transformer)
}

/**
 * Transform the given data into a pagination.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Hapi.Response}
 */
const toPagination = (request, data, transformer) => {
  return {
    results: transformCollection(request, data.rows, transformer),
    totalCount: data.count
  }
}

/**
 * @type {Object}
 */
module.exports = {
  transformResource,
  transformCollection,
  paginate,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection,
  toPagination
}
