const Handler = require('./handler')

class VoteHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply(wallet, transaction) {
    if (!super.canApply(wallet, transaction)) {
      return false
    }

    const vote = transaction.asset.votes[0]

    if (vote.startsWith('-') && wallet.vote === vote.slice(1)) {
      return true
    }

    if (vote.startsWith('+') && !wallet.vote) {
      return true
    }

    return false
  }

  /**
   * Apply the transaction to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  apply(wallet, transaction) {
    const vote = transaction.asset.votes[0]

    if (vote.startsWith('+')) {
      wallet.vote = vote.slice(1)
    }

    if (vote.startsWith('-')) {
      wallet.vote = null
    }
  }

  /**
   * Revert the transaction from the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  revert(wallet, transaction) {
    const vote = transaction.asset.votes[0]

    if (vote.startsWith('+')) {
      wallet.vote = null
    }

    if (vote.startsWith('-')) {
      wallet.vote = vote.slice(1)
    }
  }
}

module.exports = new VoteHandler()
