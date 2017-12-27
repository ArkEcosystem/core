const ajv = require('ajv')
const responder = require(`${__root}/api/responder`)

class Validator {
  constructor() {
    this.ajv = new ajv({
      v5: true,
      allErrors: true,
      useDefaults: true,
      coerceTypes: true
    })
  }

  mount(req, res, next) {
    if (!req.route.hasOwnProperty('schema')) {
      return next()
    }

    let requestData = ['params', 'body', 'query', 'user', 'headers', 'trailers'].reduce((data, key) => {
      if (req.hasOwnProperty(key)) {
        data[key] = req[key] || {}
      }

      return data
    }, {})

    let validate = this.ajv.compile(req.route.schema)

    if (!validate(requestData)) {
      if (req.version() === '1.0.0') {
        return responder.error(req, res, {
          error: validate.errors[0].message
        })
      } else {
        return responder.unprocessableEntity(res, validate.errors[0].message)
      }
    }

    return next()
  }
}

module.exports = Validator
