'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy, unserializeTransactions } = require('../../helpers')
const { Op } = require('sequelize')

module.exports = {
  transactions: async (wallet, args) => {
    const { orderBy, filter, ...params } = args

    const order = formatOrderBy(orderBy, 'timestamp:DESC')
    const walletOr = { [Op.or]: [{
      senderPublicKey: wallet.publicKey
    }, {
      recipientId: wallet.address
    }]}
    const result = await database.transactions.findAll({ ...filter, orderBy: order, ...walletOr, ...params }, false)

    return unserializeTransactions(result)
  },
  blocks: (wallet, args) => {
    const { orderBy, ...params } = args
    const order = formatOrderBy(orderBy, 'height:DESC')

    const publicKey = wallet.publicKey
    params.generatorPublickKey = publicKey

    return database.blocks.findAll({ orderBy: order, ...params }, false)
  }
}
