const Joi = require('joi')
const ark = require('@arkecosystem/client')
const database = require('../../../services/database')
const getBip38Keys = require('../../../utils/bip38-keys')

module.exports = {
  name: 'transactions.bip38.create',
  method: async (params) => {
    const account = await getBip38Keys(params.userId, params.bip38)

    const transaction = ark
      .transactionBuilder
      .transfer()
      .create(params.recipientId, params.amount)
      .setVendorField('dummy')
      .sign(params.passphrase)
      .getStruct()

    transaction.senderPublicKey = account.keys.getPublicKeyBuffer().toString('hex')

    delete transaction.signature
    ark.cryptoBuilder.sign(transaction, account.keys)
    transaction.id = ark.crypto.getId(transaction)

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
