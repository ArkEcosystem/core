'use strict';

const Boom = require('boom')
const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * [description]
 * @param  {Object} request [description]
 * @return {Object}         [description]
 */
const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit
  }
}

/**
 * [description]
 * @param  {Object} request          [description]
 * @param  {Object} data             [description]
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
 * @param  {Object} request          [description]
 * @param  {Object} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {Object}                  [description]
 */
const respondWithCollection = (request, data, transformerClass) => {
  return { data: transformCollection(request, data, transformerClass) }
}

/**
 * [description]
 * @param  {Object} request          [description]
 * @param  {Object} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

/**
 * [description]
 * @param  {Object} request          [description]
 * @param  {Object} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {[type]}                  [description]
 */
const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

/**
 * [description]
 * @param  {Object} request          [description]
 * @param  {Object} data             [description]
 * @param  {[type]} transformerClass [description]
 * @return {Object}                  [description]
 */
const toPagination = (request, data, transformerClass) => {
  return {
    results: transformCollection(request, data.rows, transformerClass),
    totalCount: data.count
  }
}

module.exports = {
  paginate,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection,
  toPagination
}
