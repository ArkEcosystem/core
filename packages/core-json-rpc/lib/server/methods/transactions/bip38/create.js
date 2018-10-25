const Joi = require('joi')
const { transactionBuilder } = require('@arkecosystem/crypto')
const database = require('../../../services/database')
const getBIP38Wallet = require('../../../utils/bip38-keys')

module.exports = {
  name: 'transactions.bip38.create',
  async method (params) {
    const { wif } = await getBIP38Wallet(params.userId, params.bip38)

    const transaction = transactionBuilder
      .transfer()
      .recipientId(params.recipientId)
      .amount(params.amount)
      .signWithWif(wif)
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
