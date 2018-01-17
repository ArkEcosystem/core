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
    const request = State.getRequest()

    this.paginator = {
      offset: parseInt(request.query.page || 1),
      limit: parseInt(request.query.perPage || 100)
    }

    return this.paginator
  }

  respondWith (method, data) {
    this.getCurrentState()

    if (data) {
      responder[method](data)
    } else {
      responder.internalServerError('Record could not be found.')
    }

    State.getNext()
  }

  respondWithPagination (data, transformerClass) {
    this.getCurrentState()

    if (data.count) {
      const paginator = new Paginator(this.request, data.count, this.paginator)

      responder.ok({
        data: this.toCollection(data.rows, transformerClass),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: data.count
        })
      })
    } else {
      responder.resourceNotFound('Record could not be found.')
    }

    State.getNext()
  }

  respondWithResource (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok({ data: this.toResource(data, transformerClass) })
    } else {
      responder.resourceNotFound('Record could not be found.')
    }

    State.getNext()
  }

  respondWithCollection (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok({ data: this.toCollection(data, transformerClass) })
    } else {
      responder.resourceNotFound('Record could not be found.')
    }

    State.getNext()
  }

  toResource (data, transformerClass) {
    this.getCurrentState()

    return new Transformer(this.request).resource(data, transformerClass)
  }

  toCollection (data, transformerClass) {
    this.getCurrentState()

    return new Transformer(this.request).collection(data, transformerClass)
  }
}

module.exports = new Helpers()
