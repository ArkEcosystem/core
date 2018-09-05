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
   * The attributes that are mass assignable.
   * @return {Array}
   */
  getColumns () {
    return [
      'address',
      'public_key',
      'second_public_key',
      'vote',
      'username',
      'balance',
      'vote_balance',
      'produced_blocks',
      'missed_blocks'
    ]
  }

  /**
   * The attribute mappings for the transformer.
   * @return {Object}
   */
  getMappings () {
    return {
      address: 'address',
      public_key: 'publicKey',
      second_public_key: 'secondPublicKey',
      vote: 'vote',
      username: 'username',
      balance: 'balance',
      vote_balance: 'voteBalance',
      produced_blocks: 'producedBlocks',
      missed_blocks: 'missedBlocks',
    }
  }
}
