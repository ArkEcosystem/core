const Joi = require('joi')
const extensions = require('./extensions')

class Engine {
  constructor () {
    this.joi = Joi.extend(extensions)
  }

  validate (attributes, rules, options) {
    return this.joi.validate(attributes, rules, Object.assign({
      convert: true
    }, options))
  }
}

module.exports = new Engine()
