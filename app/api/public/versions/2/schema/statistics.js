const Joi = require('joi')

exports.transactions = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

exports.blocks = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

exports.votes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

exports.unvotes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}
