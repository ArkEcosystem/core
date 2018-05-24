const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')

module.exports = class IPFSBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.IPFS
    this.fee = feeManager.get(TRANSACTION_TYPES.IPFS)
    this.amount = 0
    this.vendorFieldHex = null
    this.senderPublicKey = null
    this.asset = {}
  }

  /**
   * Overrides the inherited method to add the necessary parameters.
   * @param  {String} ipfsHash
   * @return {IPFSBuilder}
   */
  create (ipfsHash) {
    this.ipfsHash = ipfsHash
    return this
  }

  /**
   * Set vendor field from hash.
   * @param  {String} type
   * @return {IPFSBuilder}
   */
  setVendorField (type) {
    this.vendorFieldHex = Buffer.from(this.ipfsHash, type).toString('hex')
    while (this.vendorFieldHex.length < 128) {
      this.vendorFieldHex = '00' + this.vendorFieldHex
    }
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.vendorFieldHex = this.vendorFieldHex
    struct.asset = this.asset
    return struct
  }
}
