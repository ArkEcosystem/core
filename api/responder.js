const errors = require('restify-errors')
const MethodMissing = requireFrom('helpers/method-missing')
const State = requireFrom('api/plugins/state')
const path = require('path')
const fs = require('fs')

class Responder extends MethodMissing {
  getFilePath (name) {
    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[State.getRequest().version()]

    return path.resolve(__dirname, `public/${version}/responses/${name}`)
  }

  methodMissing (name, ...args) {
    const errorClass = `${name.charAt(0).toUpperCase() + name.slice(1)}Error`

    if (errors.hasOwnProperty(errorClass)) {
      return State.getResponse().send(new errors[errorClass](args[0]))
    }

    const responderFile = this.getFilePath(name)

    if (fs.statSync(responderFile + '.js').isFile()) {
      return require(responderFile)(args[0], args[1] || {})
    }

    throw new Error(`Method "${name}" does not exist.`)
  }
}

module.exports = new Responder()
