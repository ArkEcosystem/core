const Joi = require('joi')
const arkjs = require('arkjs')
const database = require('../../../services/database')
const getBip38Keys = require('../../../utils/bip38-keys')

module.exports = {
  name: 'transactions.bip38.create',
  method: async (params) => {
    const account = await getBip38Keys(params.userId, params.bip38)

    let transaction = arkjs.transaction.createTransaction(params.recipientId, params.amount, null, 'dummy')
    transaction.senderPublicKey = account.keys.getPublicKeyBuffer().toString('hex')

    delete transaction.signature
    arkjs.crypto.sign(transaction, account.keys)
    transaction.id = arkjs.crypto.getId(transaction)

    await database.setObject(transaction.id, transaction)

    return transaction
  },
  schema: {
    amount: Joi.number().required(),
    recipientId: Joi.string().length(34).required(),
    bip38: Joi.string().required(),
    userId: Joi.string().hex().required()
  }
}
