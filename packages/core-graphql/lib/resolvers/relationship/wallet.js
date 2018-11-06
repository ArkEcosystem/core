'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { formatOrderBy, unserializeTransactions } = require('../../helpers')

/**
 * Useful and common database operations with wallet data.
 */
module.exports = {

  /*
   * Get the transactions for a given wallet.
   * @param {Wallet} wallet
   * @param {Object} args
   * @return {Transaction[]}
   */
  async transactions (wallet, args) {
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
    const rows = result ? result.rows : []

    return unserializeTransactions(rows)
  },

  /*
   * Get the blocks generated for a given wallet.
   * @param {Wallet} wallet
   * @param {Object} args
   * @return {Block[]}
   */
  blocks (wallet, args) {
    const { orderBy, ...params } = args

    params.generatorPublickKey = wallet.publicKey

    const result = database.blocks.findAll({
      orderBy: formatOrderBy(orderBy, 'height:DESC'),
      ...params
    }, false)
    const rows = result ? result.rows : []
    return rows
  }
}
