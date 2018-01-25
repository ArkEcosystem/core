const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const State = requireFrom('api/plugins/state')

module.exports = class Helpers {
  static paginator () {
    return State.getRequest().paginator.pointer()
  }

  static respondWith (method, data) {
    data
      ? responder[method](data)
      : responder.error('Record could not be found.')

    State.getNext()
  }

  static toResource (data, transformerClass) {
    return new Transformer(State.getRequest()).resource(data, transformerClass)
  }

  static toCollection (data, transformerClass) {
    return new Transformer(State.getRequest()).collection(data, transformerClass)
  }
}
