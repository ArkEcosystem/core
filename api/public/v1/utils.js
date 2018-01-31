const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')

const paginator = (req) => {
  return req.paginator.pointer()
}

const respondWith = (req, res, method, data) => {
  (method === 'error')
    ? responder.error(req, res, data)
    : responder[method](req, res, data)

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
  toResource,
  toCollection,
}

