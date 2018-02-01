const Boom = require('boom')
const transformResource = require('../../utils/transform-resource')
const transformCollection = require('../../utils/transform-collection')

const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit
  }
}

const respondWithResource = (request, data, transformerClass) => {
  return data
    ? { data: toResource(request, data, transformerClass) }
    : Boom.notFound()
}

const respondWithCollection = (request, data, transformerClass) => {
  return { data: toCollection(request, data, transformerClass) }
}

const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

module.exports = {
  paginate,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection
}
