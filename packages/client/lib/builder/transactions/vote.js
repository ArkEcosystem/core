const feeManager = require('../../managers/fee')
const cryptoBuilder = require('../crypto')
const Transaction = require('../transaction')
const { TRANSACTION_TYPES } = require('../../constants')

module.exports = class Vote extends Transaction {
  /**
   * @constructor
   * @return {[type]} [description]
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
   * [create description]
   * @param  {Array} delegates [description]
   * @return {[type]}           [description]
   */
  create (delegates) {
    this.asset.votes = delegates
    return this
  }

  /**
   * [sign description]
   * Overrides the inherited `sign` method to set the sender as the recipient too
   * @param  {[type]} passphrase [description]
   * @return {[type]}            [description]
   */
  sign (passphrase) {
    super.sign(passphrase)
    this.recipientId = cryptoBuilder.getAddress(this.senderPublicKey)
    return this
  }

  /**
   * [getStruct description]
   * Overrides the inherited method to return the additional required by this
   * @return {Object} [description]
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    return struct
  }
}
