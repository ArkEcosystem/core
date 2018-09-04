const Bignum = require('bigi')
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
    this.data.fee = new Bignum(feeManager.get(TRANSACTION_TYPES.VOTE).toString())
    this.data.amount = Bignum.ZERO
    this.data.recipientId = null
    this.data.senderPublicKey = null
    this.data.asset = { votes: [] }
  }

  /**
   * Establish the votes on the asset.
   * @param  {Array} votes
   * @return {VoteBuilder}
   */
  votesAsset (votes) {
    this.data.asset.votes = votes
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = +this.data.amount.toString()
    struct.recipientId = this.data.recipientId
    struct.asset = this.data.asset
    return struct
  }
}

module.exports = sign.mixin(VoteBuilder)
