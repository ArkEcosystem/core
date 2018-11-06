const { bignumify } = require('@arkecosystem/core-utils')
const Model = require('./model')

module.exports = class WalletModel extends Model {
  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'wallets'
  }

  /**
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet () {
    return this.createColumnSet([{
      name: 'address'
    },
    {
      name: 'public_key',
      prop: 'publicKey'
    }, {
      name: 'second_public_key',
      prop: 'secondPublicKey'
    }, {
      name: 'vote'
    }, {
      name: 'username'
    }, {
      name: 'balance',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'vote_balance',
      prop: 'voteBalance',
      init: col => {
        return col.value ? +bignumify(col.value).toFixed() : null
      }
    }, {
      name: 'produced_blocks',
      prop: 'producedBlocks'
    }, {
      name: 'missed_blocks',
      prop: 'missedBlocks'
    }])
  }
}
