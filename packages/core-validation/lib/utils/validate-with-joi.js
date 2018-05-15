const Joi = require('joi')

module.exports = (attributes, rules) => Joi.validate(attributes, rules, { convert: true })
