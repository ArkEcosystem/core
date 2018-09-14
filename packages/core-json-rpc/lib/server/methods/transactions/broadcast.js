const Joi = require('joi')
const ark = require('@arkecosystem/crypto')
const network = require('../../services/network')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.broadcast',
  async method (params) {
    if (params.transactions) { // old way
      for (let i = 0; i < params.transactions.length; i++) {
        await network.broadcast(params.transactions[i])
      }

      return params.transactions
    }

    let transaction = await database.get(params.id)
    transaction = transaction || params

    if (!ark.crypto.verify(transaction)) {
      return {
        success: false,
        error: 'transaction does not verify',
        transaction
      }
    }

    await network.broadcast(transaction)

    return transaction
  },
  schema: {
    id: Joi.string().length(64),
    transactions: Joi.array()
  }
}
