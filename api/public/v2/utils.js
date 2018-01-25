const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const State = requireFrom('api/plugins/state')

module.exports = class Helpers {
  static paginator () {
    const pointer = State.getRequest().paginator.pointer()

    return {
      offset: (pointer.page - 1) * pointer.perPage,
      limit: pointer.perPage
    }
  }

  static respondWith (method, data) {
    data ? responder[method](data) : responder.internalServerError('Record could not be found.')

    State.getNext()
  }

  static respondWithPagination (data, transformerClass) {
    if (data.count) {
      responder.ok({
        data: this.toCollection(data.rows, transformerClass),
        links: State.getRequest().paginator.links(data.count),
        meta: { count: data.count }
      })
    } else {
      responder.ok({ data: [] })
    }

    State.getNext()
  }

  static respondWithResource (data, transformerClass) {
    data
      ? responder.ok({ data: this.toResource(data, transformerClass) })
      : responder.resourceNotFound('Record could not be found.')

    State.getNext()
  }

  static respondWithCollection (data, transformerClass) {
    data
      ? responder.ok({ data: this.toCollection(data, transformerClass) })
      : responder.ok({ data: [] })

    State.getNext()
  }

  static toResource (data, transformerClass) {
    return new Transformer(State.getRequest()).resource(data, transformerClass)
  }

  static toCollection (data, transformerClass) {
    return new Transformer(State.getRequest()).collection(data, transformerClass)
  }
}
