const Handler = require('./handler')

class VoteHandler extends Handler {
  /**
   * Check if the transaction can be applied to the wallet.
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @param {Array} errors
   * @return {Boolean}
   */
  canApply(wallet, transaction, errors) {
    if (!super.canApply(wallet, transaction, errors)) {
      return false
    }

    const vote = transaction.asset.votes[0]
    if (
      vote.startsWith('-') &&
      (!wallet.vote || wallet.vote !== vote.slice(1))
    ) {
      if (!wallet.vote) {
        errors.push('Wallet has not voted yet')
      } else {
        errors.push('Wallet vote-choice does not match transaction vote-choice')
      }
      return false
    }

    if (vote.startsWith('+') && wallet.vote) {
      errors.push('Wallet has already voted')
      return false
    }
    return true
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
