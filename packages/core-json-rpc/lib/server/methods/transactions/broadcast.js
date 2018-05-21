const Joi = require('joi')
const ark = require('@arkecosystem/client')
const network = require('../../services/network')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.broadcast',
  method: async (params) => {
    if (params.transactions) { // old way
      await Promise.all(params.transactions.map((transaction) => network.broadcast(transaction, () => Promise.resolve(transaction))))

      return params.transactions
    }

    let transaction = await database.getObject(params.id)
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
