const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
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
      offset: parseInt(request.query.offset || 0),
      limit: parseInt(request.query.limit || 100)
    }

    return this.paginator
  }

  static respondWith (method, data) {
    this.getCurrentState()

    data
      ? responder[method](data)
      : responder.internalServerError(this.response, 'Record could not be found.')

    State.getNext()
  }

  static toResource (data, transformerClass) {
    this.getCurrentState()

    return Transformer.resource(data, transformerClass)
  }

  static toCollection (data, transformerClass) {
    this.getCurrentState()

    return Transformer.collection(data, transformerClass)
  }
}
