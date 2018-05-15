const Joi = require('joi')
const validate = require('../utils/validate-with-joi')

module.exports = (attributes) => {
  const { error, value } = validate(attributes, Joi.string().alphanum())

  return {
    data: value,
    passes: !error,
    fails: error
  }
}
