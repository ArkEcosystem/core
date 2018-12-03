const Joi = require('joi')
const extensions = require('./extensions')

class Engine {
  constructor() {
    this.joi = Joi.extend(extensions)
  }

  validate(attributes, rules, options) {
    try {
      return this.joi.validate(
        attributes,
        rules,
        Object.assign(
          {
            convert: true,
          },
          options,
        ),
      )
    } catch (error) {
      return { value: null, error: error.stack }
    }
  }
}

module.exports = new Engine()
