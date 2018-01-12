const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class Controller {
  respondWithPagination(data, transformerClass, pager, req, res) {
    const paginator = new Paginator(req, data.count, pager)

    responder.ok(req, res, {
      data: new transformer(req).collection(data.rows, transformerClass),
      links: paginator.links(),
      meta: Object.assign(paginator.meta(), {
        count: data.count
      }),
    })
  }

  respondWithResource(req, res, data, transformer) {
    return responder.ok(req, res, {
      data: new transformer(req).collection(data, transformer),
    })
  }

  respondWithCollection(req, res, data, transformer) {
    return responder.ok(req, res, {
      data: new transformer(req).collection(data, transformer),
    })
  }

  pager(req) {
      return {
        page: parseInt(req.query.page || 1),
        perPage: parseInt(req.query.perPage || 100)
      }
  }
}

module.exports = Controller
