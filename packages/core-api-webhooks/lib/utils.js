'use strict';

const Boom = require('boom')

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Object}
 */
const transformResource = (request, data, transformer) => {
  return require('./transformer')(data)
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformer
 * @return {Array}
 */
const transformCollection = (request, data, transformer) => {
  return data.map((d) => transformResource(request, d, transformer))
}

/**
 * [description]
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
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformerClass
 * @return {Hapi.Response}
 */
const respondWithResource = (request, data, transformerClass) => {
  return data
    ? { data: transformResource(request, data, transformerClass) }
    : Boom.notFound()
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformerClass
 * @return {Object}
 */
const respondWithCollection = (request, data, transformerClass) => {
  return { data: transformCollection(request, data, transformerClass) }
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformerClass
 * @return {Hapi.Response}
 */
const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformerClass
 * @return {Hapi.Response}
 */
const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {Object} transformerClass
 * @return {Hapi.Response}
 */
const toPagination = (request, data, transformerClass) => {
  return {
    results: transformCollection(request, data.rows, transformerClass),
    totalCount: data.count
  }
}

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
