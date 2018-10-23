const Joi = require('joi')
const { transactionBuilder } = require('@arkecosystem/crypto')
const database = require('../../../services/database')
const getBip38Keys = require('../../../utils/bip38-keys')

module.exports = {
  name: 'transactions.bip38.create',
  async method (params) {
    const account = await getBip38Keys(params.userId, params.bip38)

    const transaction = transactionBuilder
      .transfer()
      .recipientId(params.recipientId)
      .amount(params.amount)
      .signWithWif(account.wif)
      .getStruct()

    await database.set(transaction.id, transaction)

    return transaction
  },
  schema: {
    amount: Joi.number().required(),
    recipientId: Joi.string().length(34).required(),
    bip38: Joi.string().required(),
    userId: Joi.string().hex().required()
  }
}
