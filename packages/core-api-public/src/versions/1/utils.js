'use strict';

const { transformResource, transformCollection } = require('../../utils/transformer')
const config = require('@arkecosystem/core-plugin-manager').get('config')

/**
 * [description]
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
const paginator = (request) => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || config.api.public.pagination.limit
  }
}

/**
 * [description]
 * @param  {[type]}  data  [description]
 * @param  {Boolean} error [description]
 * @return {[type]}        [description]
 */
const respondWith = (data, error = false) => {
  return error
    ? { error: data, success: false }
    : { ...data, success: true }
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

module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
