const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')

const paginator = (req) => {
  const pointer = req.paginator.pointer()

  return {
    offset: (pointer.page - 1) * pointer.perPage,
    limit: pointer.perPage
  }
}

const respondWith = (req, res, method, data) => {
  data
    ? responder[method](req, res, data)
    : responder.internalServerError(req, res, 'Record could not be found.')

  return Promise.resolve()
}

const respondWithPagination = (req, res, data, transformerClass) => {
  if (data.count) {
    responder.ok(req, res, {
      data: toCollection(req, data.rows, transformerClass),
      links: req.paginator.links(data.count),
      meta: { count: data.count }
    })
  } else {
    responder.ok(req, res, { data: [] })
  }

  return Promise.resolve()
}

const respondWithResource = (req, res, data, transformerClass) => {
  data
    ? responder.ok(req, res, { data: toResource(req, data, transformerClass) })
    : responder.resourceNotFound(req, res, 'Record could not be found.')

  return Promise.resolve()
}

const respondWithCollection = (req, res, data, transformerClass) => {
  data
    ? responder.ok(req, res, { data: toCollection(req, data, transformerClass) })
    : responder.ok(req, res, { data: [] })

  return Promise.resolve()
}

const toResource = (req, data, transformerClass) => {
  return new Transformer(req).resource(data, transformerClass)
}

const toCollection = (req, data, transformerClass) => {
  return new Transformer(req).collection(data, transformerClass)
}

module.exports = {
  paginator,
  respondWith,
  respondWithPagination,
  respondWithResource,
  respondWithCollection,
  toResource,
  toCollection,
}
