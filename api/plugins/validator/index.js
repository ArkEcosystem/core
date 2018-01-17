const fs = require('fs')
const path = require('path')
const AJV = require('ajv')
const responder = requireFrom('api/responder')

module.exports = class Validator {
  constructor () {
    this.ajv = new AJV({
      extendRefs: 'fail',
      useDefaults: true,
      coerceTypes: true
    })

    this.registerCustomFormats()
  }

  mount (req, res, next) {
    if (!req.route.hasOwnProperty('schema')) {
      return next()
    }

    let requestData = {};

    ['POST', 'PUT', 'PATCH'].some(method => (requestData = req.route.method.indexOf(method) >= 0 ? req.body : req.query))

    let validate = this.ajv.compile(req.route.schema)

    if (!validate(requestData)) {
      if (req.version() === '1.0.0') {
        return responder.error(req, res, {
          error: validate.errors[0].message
        })
      }

      return responder.unprocessableEntity(res, validate.errors[0].message)
    }

    return next()
  }

  registerCustomFormats () {
    let directory = path.resolve(__dirname, 'formats')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        require(directory + '/' + file)(this.ajv)
      }
    })
  }
}
