const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const sign = require('./mixins/sign')

class VoteBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.data.type = TRANSACTION_TYPES.VOTE
    this.data.fee = feeManager.get(TRANSACTION_TYPES.VOTE)
    this.data.amount = 0
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { votes: {} }
  }

  /**
   * Create vote transaction with delegate votes.
   * @param  {Array} delegates
   * @return {VoteBuilder}
   */
  create (delegates) {
    this.data.asset.votes = delegates
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    return struct
  }
}

module.exports = sign.mixin(VoteBuilder)
