'use strict'

const Boom = require('boom')
const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit || 0,
    limit: request.query.limit || 100
  }
}

/**
 * Respond with a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const respondWithResource = (request, data, transformerClass) => {
  return data
    ? { data: transformResource(request, data, transformerClass) }
    : Boom.notFound()
}

/**
 * Respond with a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const respondWithCollection = (request, data, transformerClass) => {
  return { data: transformCollection(request, data, transformerClass) }
}

/**
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

/**
 * Transform the given data into a pagination.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toPagination = (request, data, transformerClass) => {
  return {
    results: transformCollection(request, data.rows, transformerClass),
    totalCount: data.count
  }
}

/**
 * @type {Object}
 */
module.exports = {
  paginate,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection,
  toPagination
}
