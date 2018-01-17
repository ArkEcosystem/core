const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const State = requireFrom('api/plugins/state')

class Helpers {
  getCurrentState () {
    this.request = State.getRequest()
    this.response = State.getResponse()

    this.initPager()
  }

  initPager () {
    if (this.pager) return this.pager

    // limit and offset are fucking aids, rename this bullshit
    this.pager = {
      offset: parseInt(State.getRequest().query.offset || 1),
      limit: parseInt(State.getRequest().query.limit || 100)
    }

    return this.pager
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
