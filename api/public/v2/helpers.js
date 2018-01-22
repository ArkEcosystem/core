const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')
const State = requireFrom('api/plugins/state')

module.exports = class Helpers {
  static getCurrentState () {
    this.request = State.getRequest()
    this.response = State.getResponse()

    this.getPaginator()
  }

  static getPaginator () {
    const request = State.getRequest()

    this.paginator = {
      offset: parseInt(request.query.cursor || 0),
      limit: parseInt(request.query.limit || 100)
    }

    return this.paginator
  }

  static respondWith (method, data) {
    this.getCurrentState()

    data ? responder[method](data) : responder.internalServerError('Record could not be found.')

    State.getNext()
  }

  static respondWithPagination (data, transformerClass) {
    this.getCurrentState()

    if (data.count) {
      const paginator = new Paginator(data.count, this.paginator)

      responder.ok({
        data: this.toCollection(data.rows, transformerClass),
        meta: paginator.meta()
      })
    } else {
      responder.noContent('Record could not be found.')
    }

    State.getNext()
  }

  static respondWithResource (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok({ data: this.toResource(data, transformerClass) })
    } else {
      responder.resourceNotFound('Record could not be found.')
    }

    State.getNext()
  }

  static respondWithCollection (data, transformerClass) {
    this.getCurrentState()

    if (data) {
      responder.ok({ data: this.toCollection(data, transformerClass) })
    } else {
      responder.noContent('Record could not be found.')
    }

    State.getNext()
  }

  static toResource (data, transformerClass) {
    this.getCurrentState()

    return new Transformer(this.request).resource(data, transformerClass)
  }

  static toCollection (data, transformerClass) {
    this.getCurrentState()

    return new Transformer(this.request).collection(data, transformerClass)
  }
}
