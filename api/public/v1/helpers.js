const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
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
      offset: parseInt(request.query.offset || 1),
      limit: parseInt(request.query.limit || 100)
    }

    return this.paginator
  }

  respondWith (method, data) {
    this.getCurrentState()

    if (data) {
      responder[method](data)
    } else {
      responder.internalServerError(this.response, 'Record could not be found.')
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
