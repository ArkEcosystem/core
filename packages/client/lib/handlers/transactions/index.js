const { TRANSACTION_TYPES } = require('../../constants')

class TransactionHandler {
  /**
   * [constructor description]
   */
  constructor () {
    this.handlers = {
      [TRANSACTION_TYPES.TRANSFER]: require('./transfer'),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: require('./second-signature'),
      [TRANSACTION_TYPES.DELEGATE]: require('./delegate'),
      [TRANSACTION_TYPES.VOTE]: require('./vote'),
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: require('./multi-signature'),
      [TRANSACTION_TYPES.IPFS]: require('./ipfs'),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: require('./timelock-transfer'),
      [TRANSACTION_TYPES.MULTI_PAYMENT]: require('./multi-payment'),
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: require('./delegate-resignation')
    }
  }

  /**
   * [canApply description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  canApply (wallet, transaction) {
    return this.handlers[transaction.type].canApply(wallet, transaction)
  }

  /**
   * [apply description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  apply (wallet, transaction) {
    return this.handlers[transaction.type].apply(wallet, transaction)
  }

  /**
   * [applyTransactionToSender description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  applyTransactionToSender (wallet, transaction) {
    return this.handlers[transaction.type].applyTransactionToSender(wallet, transaction)
  }

  /**
   * [applyTransactionToRecipient description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  applyTransactionToRecipient (wallet, transaction) {
    return this.handlers[transaction.type].applyTransactionToRecipient(wallet, transaction)
  }

  /**
   * [revert description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  revert (wallet, transaction) {
    return this.handlers[transaction.type].revert(wallet, transaction)
  }

  /**
   * [revertTransactionForSender description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  revertTransactionForSender (wallet, transaction) {
    return this.handlers[transaction.type].revertTransactionForSender(wallet, transaction)
  }

  /**
   * [revertTransactionForRecipient description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  revertTransactionForRecipient (wallet, transaction) {
    return this.handlers[transaction.type].revertTransactionForRecipient(wallet, transaction)
  }

  /**
   * [validate description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  validate (wallet, transaction) {
    return this.handlers[transaction.type].validate(wallet, transaction)
  }
}

module.exports = new TransactionHandler()
