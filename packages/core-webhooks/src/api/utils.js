const Boom = require('boom')

const transformResource = (request, data, transformer) => {
  return require('./transformer')(data)
}

const transformCollection = (request, data, transformer) => {
  return data.map((d) => transformResource(request, d, transformer))
}

const paginate = (request) => {
  return {
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit
  }
}

const respondWithResource = (request, data, transformerClass) => {
  return data
    ? { data: transformResource(request, data, transformerClass) }
    : Boom.notFound()
}

const respondWithCollection = (request, data, transformerClass) => {
  return { data: transformCollection(request, data, transformerClass) }
}

const toResource = (request, data, transformerClass) => {
  return transformResource(request, data, transformerClass)
}

const toCollection = (request, data, transformerClass) => {
  return transformCollection(request, data, transformerClass)
}

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
