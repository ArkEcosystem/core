const Joi = require('joi')
const validate = require('../utils/validate-with-joi')

module.exports = (attributes) => {
  const { error, value } = validate(attributes, Joi.string().regex(/^[a-z0-9!@$&_.]+$/))

  return {
    data: value,
    passes: !error,
    fails: error
  }
}
