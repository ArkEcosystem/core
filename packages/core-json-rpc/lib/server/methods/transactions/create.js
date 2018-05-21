const Joi = require('joi')
const arkjs = require('arkjs')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.create',
  method: async (params) => {
    const amount = parseInt(params.amount)
    const transaction = arkjs.transaction.createTransaction(params.recipientId, amount, null, params.passphrase)

    await database.setObject(transaction.id, transaction)

    return transaction
  },
  schema: {
    amount: Joi.number().required(),
    recipientId: Joi.string().required(),
    passphrase: Joi.string().required()
  }
}
