const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class Controller {
  setState(request, response) {
    this.request = request
    this.response = response

    if (this.request.query.page) {
      this.pager = {
        page: parseInt(this.request.query.page || 1),
        perPage: parseInt(this.request.query.perPage || 100)
      }
    }

    return Promise.resolve(true)
  }

  respondWithPagination(data, transformerClass) {
    const paginator = new Paginator(this.request, data.count, this.pager)

    responder.ok(this.request, this.response, {
      data: new transformer(this.request).collection(data.rows, transformerClass),
      links: paginator.links(),
      meta: Object.assign(paginator.meta(), {
        count: data.count
      }),
    })
  }

  respondWithResource(data, transformer) {
    return responder.ok(this.request, this.response, {
      data: new transformer(this.request).collection(data, transformer),
    })
  }

  respondWithCollection(data, transformer) {
    return responder.ok(this.request, this.response, {
      data: new transformer(this.request).collection(data, transformer),
    })
  }
}

module.exports = Controller
