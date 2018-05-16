const Joi = require('joi')
const extensions = require('./extensions')

class Engine {
  constructor () {
    this.joi = Joi.extend(extensions)
  }

  validate (attributes, rules) {
    return this.joi.validate(attributes, rules, {
      convert: true
    })
  }
}

module.exports = new Engine()
