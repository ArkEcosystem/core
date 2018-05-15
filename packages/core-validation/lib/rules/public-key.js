const Joi = require('joi')
const validateWithJoi = require('../utils/validate-with-joi')

module.exports = (attributes) => {
  const { error, value } = validateWithJoi(attributes, Joi.string().alphanum().length(66))

  return {
    data: value,
    passes: !error,
    fails: error
  }
}
