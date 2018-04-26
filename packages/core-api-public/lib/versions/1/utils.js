'use strict';

const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * [description]
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginator = (request) => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || 100
  }
}

/**
 * [description]
 * @param  {Object}  data
 * @param  {Boolean} error
 * @return {Object}
 */
const respondWith = (data, error = false) => {
  return error
    ? { error: data, success: false }
    : { ...data, success: true }
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

/**
 * [description]
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
