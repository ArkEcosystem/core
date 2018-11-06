'use strict'

const Boom = require('boom')
const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginate = (request) => {
  let pagination = {
    offset: (request.query.page - 1) * request.query.limit || 0,
    limit: request.query.limit || 100
  }

  if (request.query.offset) {
    pagination.offset = request.query.offset
  }

  return pagination
}

/**
 * Respond with a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
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
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
 */
const toResource = (request, data, transformer) => {
  return transformResource(request, data, transformer)
}

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
 */
const toCollection = (request, data, transformer) => {
  return transformCollection(request, data, transformer)
}

/**
 * Transform the given data into a pagination.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformer
 * @return {Object}
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
  paginate,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection,
  toPagination
}
