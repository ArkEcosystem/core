class WalletModel {
  /**
   * Convert the "camel_case" keys to "snake_case".
   *
   * @return array
   */
  transform (wallet) {
    wallet.public_key = wallet.publicKey
    wallet.second_public_key = wallet.secondPublicKey
    wallet.vote_balance = wallet.voteBalance
    wallet.produced_blocks = wallet.producedBlocks
    wallet.missed_blocks = wallet.missedBlocks

    return wallet
  }

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
}

module.exports = WalletModel
