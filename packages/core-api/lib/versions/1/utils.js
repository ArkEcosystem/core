'use strict'

const { transformResource, transformCollection } = require('../../utils/transformer')

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginator = request => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || 100
  }
}

/**
 * Create a hapi.js response.
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
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toResource = (request, data, transformerClass) => {
  if (data.balance) data.balance = `${data.balance}`
  if (data.unconfirmedBalance) data.unconfirmedBalance = `${data.unconfirmedBalance}`
  return transformResource(request, data, transformerClass)
}

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @param  {String} transformerClass
 * @return {Object}
 */
const toCollection = transformCollection

/**
 * @type {Object}
 */
module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
