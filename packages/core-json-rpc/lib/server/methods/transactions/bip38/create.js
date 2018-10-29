const Boom = require('boom')
const Joi = require('joi')
const { transactionBuilder } = require('@arkecosystem/crypto')
const database = require('../../../services/database')
const getBIP38Wallet = require('../../../utils/bip38-keys')

module.exports = {
  name: 'transactions.bip38.create',
  async method (params) {
    const wallet = await getBIP38Wallet(params.userId, params.bip38)

    if (!wallet) {
      return Boom.notFound(`User ${params.userId} could not be found.`)
    }

    const transaction = transactionBuilder
      .transfer()
      .recipientId(params.recipientId)
      .amount(params.amount)
      .signWithWif(wallet.wif)
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
