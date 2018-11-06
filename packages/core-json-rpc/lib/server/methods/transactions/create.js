const Joi = require('joi')
const { transactionBuilder } = require('@arkecosystem/crypto')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.create',
  async method (params) {
    const transaction = transactionBuilder
      .transfer()
      .recipientId(params.recipientId)
      .amount(params.amount)
      .sign(params.passphrase)
      .getStruct()

    await database.set(transaction.id, transaction)

    return transaction
  },
  schema: {
    amount: Joi.number().required(),
    recipientId: Joi.string().required(),
    passphrase: Joi.string().required()
  }
}
