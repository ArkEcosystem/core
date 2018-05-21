const Joi = require('joi')
const ark = require('@arkecosystem/client')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.create',
  method: async (params) => {
    const amount = parseInt(params.amount)

    const transaction = ark
      .transactionBuilder
      .transfer()
      .create(params.recipientId, amount)
      .sign(params.passphrase)
      .getStruct()

    await database.setObject(transaction.id, transaction)

    return transaction
  },
  schema: {
    amount: Joi.number().required(),
    recipientId: Joi.string().required(),
    passphrase: Joi.string().required()
  }
}
