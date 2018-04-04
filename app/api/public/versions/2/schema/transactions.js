const Joi = require('joi')

exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

// TODO: validate transaction payload?
exports.store = {
  params: {},
  query: {},
  payload: {}
}

exports.show = {
  params: {
    id: Joi.string()
  }
}

exports.unconfirmed = {
  query: {
    offset: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.showUnconfirmed = {
  params: {
    id: Joi.string()
  }
}

// TODO: fill out schema according to tests
exports.search = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  },
  payload: {
    transactionId: Joi.string(),
    blockId: Joi.string(),
    type: Joi.number().integer(),
    version: Joi.number().integer(),
    senderPublicKey: Joi.string(),
    senderAddress: Joi.string(),
    recipientAddress: Joi.string(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    amount: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    fee: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
