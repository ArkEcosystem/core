const transformResource = require('../../utils/transform-resource')
const transformCollection = require('../../utils/transform-collection')

const paginator = (request) => {
  return {
    offset: request.query.offset || 0,
    limit: request.query.limit || 100
  }
}

const respondWith = (data, error = false) => {
  return error
    ? { error: data, success: false }
    : { ...data, success: true }
}

const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass).then(resource => resource)
}

const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass).then(collection => collection)
}

module.exports = {
  paginator,
  respondWith,
  toResource,
  toCollection
}
