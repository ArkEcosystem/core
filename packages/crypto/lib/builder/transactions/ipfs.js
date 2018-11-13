const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')

module.exports = class IPFSBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.data.type = TRANSACTION_TYPES.IPFS
    this.data.fee = feeManager.get(TRANSACTION_TYPES.IPFS)
    this.data.amount = 0
    this.data.vendorFieldHex = null
    this.data.senderPublicKey = null
    this.data.asset = {}
  }

  /**
   * Set the IPFS hash.
   * @param  {String} ipfsHash
   * @return {IPFSBuilder}
   */
  ipfsHash(ipfsHash) {
    this.data.ipfsHash = ipfsHash
    return this
  }

  /**
   * Set vendor field from hash.
   * @param  {String} type TODO is it necessary?
   * @return {IPFSBuilder}
   */
  vendorField(type) {
    this.data.vendorFieldHex = Buffer.from(this.data.ipfsHash, type).toString(
      'hex',
    )

    while (this.data.vendorFieldHex.length < 128) {
      this.data.vendorFieldHex = `00${this.data.vendorFieldHex}`
    }

    // TODO is this right? when is vendorFieldHex.length is odd,
    // it will add 1 more "0" than previous way
    // const vendorFieldHex = Buffer.from(this.data.ipfsHash, type).toString('hex')
    // this.data.vendorFieldHex = vendorFieldHex.padStart(128, '0')

    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this.
   * @return {Object}
   */
  getStruct() {
    const struct = super.getStruct()
    struct.amount = this.data.amount
    struct.vendorFieldHex = this.data.vendorFieldHex
    struct.asset = this.data.asset
    return struct
  }
}
