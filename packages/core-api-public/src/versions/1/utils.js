'use strict';

const { transformResource, transformCollection } = require('../../utils/transformer')
const config = require('@arkecosystem/core-pluggy').get('config')

const paginator = (request) => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || config.api.public.pagination.limit
  }
}

const respondWith = (data, error = false) => {
  return error
    ? { error: data, success: false }
    : { ...data, success: true }
}

const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
