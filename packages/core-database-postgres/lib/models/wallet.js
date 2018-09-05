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
      publicKey: 'public_key',
      secondPublicKey: 'second_public_key',
      vote: 'vote',
      username: 'username',
      balance: 'balance',
      voteBalance: 'vote_balance',
      producedBlocks: 'produced_blocks',
      missedBlocks: 'missed_blocks'
    }
  }
}
