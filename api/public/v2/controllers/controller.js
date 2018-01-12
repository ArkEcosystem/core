const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class Controller {
  setState(request, response) {
    this.request = request
    this.response = response

    this.pager = {
      page: parseInt(this.request.query.page || 1),
      perPage: parseInt(this.request.query.perPage || 100)
    }

    return Promise.resolve(db)
  }

  respondWithPagination(condition, data, transformerClass) {
    if (condition) {
      const paginator = new Paginator(this.request, data.count, this.pager)

      responder.ok(this.request, this.response, {
        data: new transformer(this.request).collection(data.rows, transformerClass),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: data.count
        })
      });
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }
  }

  respondWithResource(condition, data, transformerClass) {
    if (condition) {
      responder.ok(this.request, this.response, {
        data: new transformer(this.request).collection(data, transformerClass),
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }
  }

  respondWithCollection(condition, data, transformerClass) {
    if (condition) {
      responder.ok(this.request, this.response, {
        data: new transformer(this.request).collection(data, transformerClass),
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }
  }
}

module.exports = Controller
