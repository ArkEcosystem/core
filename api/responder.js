const errors = require('restify-errors')
const MethodMissing = requireFrom('helpers/method-missing')

class Responder extends MethodMissing {
  createResponse (name, request, response, data, headers) {
    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[request.version()]

    requireFrom(`api/public/${version}/responses/${name}`).send(request, response, data, headers)
  }

  ok (request, response, data, headers = {}) {
    this.createResponse('ok', request, response, data, headers)
  }

  created (request, response, data, headers = {}) {
    this.createResponse('created', request, response, data, headers)
  }

  noContent (request, response, data, headers = {}) {
    this.createResponse('no-content', request, response, data, headers)
  }

  error (request, response, data, headers = {}) {
    this.createResponse('error', request, response, data, headers) // only for v1
  }

  methodMissing (name, ...args) {
    const errorClass = `${name.charAt(0).toUpperCase() + name.slice(1)}Error`

    if (errors.hasOwnProperty(errorClass)) {
      return args[0].send(new errors[errorClass](args[1]))
    }

    throw new Error(`Method "${name}" does not exist.`)
  }
}

module.exports = new Responder()
