const errors = require('restify-errors')
const MethodMissing = requireFrom('helpers/method-missing')
const State = requireFrom('api/plugins/state')

class Responder extends MethodMissing {
  createResponse (name, data, headers) {
    const request = State.getRequest()

    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[request.version()]

    requireFrom(`api/public/${version}/responses/${name}`).send(request, State.getResponse(), data, headers)
  }

  ok (data, headers = {}) {
    this.createResponse('ok', data, headers)
  }

  created (data, headers = {}) {
    this.createResponse('created', data, headers)
  }

  noContent (data, headers = {}) {
    this.createResponse('no-content', data, headers)
  }

  error (data, headers = {}) {
    this.createResponse('error', data, headers) // only for v1
  }

  methodMissing (name, ...args) {
    const errorClass = `${name.charAt(0).toUpperCase() + name.slice(1)}Error`

    if (errors.hasOwnProperty(errorClass)) {
      return State.getResponse().send(new errors[errorClass](args[0]))
    }

    throw new Error(`Method "${name}" does not exist.`)
  }
}

module.exports = new Responder()
