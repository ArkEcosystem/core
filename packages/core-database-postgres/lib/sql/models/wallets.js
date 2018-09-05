class WalletModel {
  transform (wallet) {
    wallet.public_key = wallet.publicKey
    wallet.second_public_key = wallet.secondPublicKey
    wallet.vote_balance = wallet.voteBalance
    wallet.produced_blocks = wallet.producedBlocks
    wallet.missed_blocks = wallet.missedBlocks

    return wallet
  }

  getTable () {
    return 'wallets'
  }

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
