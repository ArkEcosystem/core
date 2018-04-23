'use strict';

const Boom = require('boom')

/**
 * [description]
 * @param  {[type]} request     [description]
 * @param  {[type]} data        [description]
 * @param  {[type]} transformer [description]
 * @return {[type]}             [description]
 */
const transformResource = (request, data, transformer) => {
  return require('./transformer')(data)
}

/**
 * [description]
 * @param  {[type]} request     [description]
 * @param  {[type]} data        [description]
 * @param  {[type]} transformer [description]
 * @return {[type]}             [description]
 */
const transformCollection = (request, data, transformer) => {
  return data.map((d) => transformResource(request, d, transformer))
}

/**
 * [description]
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit
  }
}

/**
 * [description]
 * @param  {[type]} request          [description]
 * @param  {[type]} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const respondWithResource = (request, data, transformerClass) => {
  return data
    ? { data: transformResource(request, data, transformerClass) }
    : Boom.notFound()
}

/**
 * [description]
 * @param  {[type]} request          [description]
 * @param  {[type]} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const respondWithCollection = (request, data, transformerClass) => {
  return { data: transformCollection(request, data, transformerClass) }
}

/**
 * [description]
 * @param  {[type]} request          [description]
 * @param  {[type]} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

/**
 * [description]
 * @param  {[type]} request          [description]
 * @param  {[type]} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

/**
 * [description]
 * @param  {[type]} request          [description]
 * @param  {[type]} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
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
