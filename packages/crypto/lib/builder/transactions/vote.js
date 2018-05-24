const feeManager = require('../../managers/fee')
const { crypto } = require('../../crypto')
const { TRANSACTION_TYPES } = require('../../constants')
const Transaction = require('./transaction')

module.exports = class Vote extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.VOTE
    this.fee = feeManager.get(TRANSACTION_TYPES.VOTE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { votes: {} }
  }

  /**
   * Create vote transaction with delegate votes.
   * @param  {Array} delegates
   * @return {Vote}
   */
  create (delegates) {
    this.asset.votes = delegates
    return this
  }

  /**
   * Overrides the inherited `sign` method to set the sender as the recipient too
   * @param  {String} passphrase
   * @return {Vote}
   */
  sign (passphrase) {
    this.recipientId = crypto.getAddress(crypto.getKeys(passphrase).publicKey)
    super.sign(passphrase)
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    return struct
  }
}
