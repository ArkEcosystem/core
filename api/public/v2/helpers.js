const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')
const State = requireFrom('api/plugins/state')

class Helpers {
  getCurrentState () {
    this.request = State.getRequest()
    this.response = State.getResponse()

    this.getPaginator()
  }

  getPaginator () {
    if (this.paginator) return this.paginator

    // limit and offset are fucking aids, rename this bullshit
    this.paginator = {
      offset: parseInt(State.getRequest().query.page || 1),
      limit: parseInt(State.getRequest().query.perPage || 100)
    }

    return this.paginator
  }

  respondWith (method, data) {
    this.getCurrentState()

    if (data) {
      if (['ok', 'created', 'noContent'].some(m => method.indexOf(m) >= 0)) {
        responder[method](this.request, this.response, data)
      } else {
        responder[method](this.response, data)
      }
    } else {
      responder.internalServerError(this.response, 'Record could not be found.')
    }

    State.getNext()
  }

  respondWithPagination (data, transformerClass) {
    this.getCurrentState()

    if (data.count) {
      const paginator = new Paginator(this.request, data.count, this.paginator)

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

    State.getNext()
  }

  respondWithResource (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok(this.request, this.response, {
        data: new Transformer(this.request).resource(data, transformerClass)
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }

    State.getNext()
  }

  respondWithCollection (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok(this.request, this.response, {
        data: new Transformer(this.request).collection(data, transformerClass)
      })
    } else {
      responder.resourceNotFound(this.response, 'Record could not be found.')
    }

    State.getNext()
  }
}

module.exports = new Helpers()
