'use strict';

const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * [description]
 * @param  {Object} request [description]
 * @return {Object}         [description]
 */
const paginator = (request) => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || 100
  }
}

/**
 * [description]
 * @param  {Object}  data  [description]
 * @param  {Boolean} error [description]
 * @return {Object}        [description]
 */
const respondWith = (data, error = false) => {
  return error
    ? { error: data, success: false }
    : { ...data, success: true }
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

module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
