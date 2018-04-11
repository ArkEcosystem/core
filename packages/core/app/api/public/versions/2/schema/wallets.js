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

exports.transactions = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.transactionsSent = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.transactionsReceived = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.votes = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.search = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  },
  payload: {
    address: Joi.string(),
    publicKey: Joi.string(),
    secondPublicKey: Joi.string(),
    vote: Joi.string(),
    username: Joi.string(),
    balance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    votebalance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
