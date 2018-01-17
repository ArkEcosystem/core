const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class Controller {
  init (request, response, next) {
    this.request = request
    this.response = response
    this.next = next

    // limit and offset are fucking aids, rename this bullshit
    this.pager = {
      offset: parseInt(this.request.query.page || 1),
      limit: parseInt(this.request.query.perPage || 100)
    }

    return Promise.resolve(db)
  }

  respondWith (method, data) {
    if (data) {
      if (['ok', 'created', 'noContent'].some(m => method.indexOf(m) >= 0)) {
        responder[method](this.request, this.response, data)
      } else {
        responder[method](this.response, data)
      }
    } else {
      responder.internalServerError(this.response, 'Record could not be found.')
    }

    this.next()
  }

  respondWithPagination (data, transformerClass) {
    if (data.count) {
      const paginator = new Paginator(this.request, data.count, this.pager)

      responder.ok(this.request, this.response, {
        data: new Transformer(this.request).collection(data.rows, transformerClass),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: data.count
        })
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }

    this.next()
  }

  respondWithResource (data, transformerClass) {
    if (data) {
      responder.ok(this.request, this.response, {
        data: new Transformer(this.request).resource(data, transformerClass)
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }

    this.next()
  }

  respondWithCollection (data, transformerClass) {
    if (data) {
      responder.ok(this.request, this.response, {
        data: new Transformer(this.request).collection(data, transformerClass)
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }

    this.next()
  }
}

module.exports = Controller
