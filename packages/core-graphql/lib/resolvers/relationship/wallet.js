'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy, unserializeTransactions } = require('../../helpers')

module.exports = {
  transactions: async (wallet, args) => {
    const { orderBy, filter, ...params } = args

    const walletOr = database.createCondition('OR', [{
      senderPublicKey: wallet.publicKey
    }, {
      recipientId: wallet.address
    }])

    const result = await database.transactions.findAll({
      ...filter,
      orderBy: formatOrderBy(orderBy, 'timestamp:DESC'),
      ...walletOr,
      ...params
    }, false)

    return unserializeTransactions(result)
  },
  blocks: (wallet, args) => {
    const { orderBy, ...params } = args

    params.generatorPublickKey = wallet.publicKey

    return database.blocks.findAll({
      orderBy: formatOrderBy(orderBy, 'height:DESC'),
      ...params
    }, false)
  }
}
