'use strict';

const Joi = require('joi')

exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.show = {
  params: {
    id: Joi.string()
  }
}
