const Transaction = require('../../models/transaction')
const { crypto, slots } = require('../../crypto')
const configManager = require('../../managers/config')

module.exports = class TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    this.data = {
      id: null,
      timestamp: slots.getTime(),
      version: 0x01,
      network: configManager.get('pubKeyHash')
    }
  }

  build () {
    return new Transaction()
  }

  /**
   * Create new instance.
   * @return {TransactionBuilder}
   */
  create () {
    return this
  }

  /**
   * Set transaction version.
   * @param {Number} version
   * @return {TransactionBuilder}
   */
  version (version) {
    this.data.version = version
    return this
  }

  /**
   * Set transaction fee.
   * @param {Number} fee
   * @return {TransactionBuilder}
   */
  fee (fee) {
    this.data.fee = fee
    return this
  }

  /**
   * Set amount to transfer.
   * @param  {Number} amount
   * @return {TransactionBuilder}
   */
  amount (amount) {
    this.data.amount = amount
    return this
  }

  /**
   * Set recipient id.
   * @param  {String} recipientId
   * @return {TransactionBuilder}
   */
  recipientId (recipientId) {
    this.data.recipientId = recipientId
    return this
  }

  /**
   * Set sender public key.
   * @param  {String} publicKey
   * @return {TransactionBuilder}
   */
  senderPublicKey (publicKey) {
    this.data.senderPublicKey = publicKey
    return this
  }

  /**
   * Verify the transaction.
   * @return {Boolean}
   */
  verify () {
    // TODO
    return crypto.verify(this)
  }

  /**
   * Serialize the transaction.
   * TODO @deprecated when a Transaction model is returned
   * @return {Buffer}
   */
  serialize () {
    return this.model.serialize(this.getStruct())
  }

  /**
   * Sign transaction using passphrase.
   * @param  {String} passphrase
   * @return {TransactionBuilder}
   */
  sign (passphrase) {
    const keys = crypto.getKeys(passphrase)
    this.data.senderPublicKey = keys.publicKey
    this.data.signature = crypto.sign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Sign transaction with second passphrase.
   * @param  {String} secondPassphrase
   * @return {TransactionBuilder}
   */
  secondSign (secondPassphrase) {
    const keys = crypto.getKeys(secondPassphrase)
    // TODO sign or second?
    this.data.signSignature = crypto.secondSign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Get structure of transaction
   * @return {Object}
   */
  getStruct () {
    return {
      // hex: crypto.getBytes(this).toString('hex'), // v2
      id: crypto.getId(this).toString('hex'), // TODO
      signature: this.data.signature,
      signSignature: this.data.signSignature,
      timestamp: this.data.timestamp,

      type: this.data.type,
      fee: this.data.fee,
      senderPublicKey: this.data.senderPublicKey
    }
  }

  /**
   * Get a valid object used to sign a transaction.
   * @return {Object}
   */
  __getSigningObject () {
    const { data } = this

    Object.keys(data).forEach(key => {
      if (['model', 'network', 'id'].includes(key)) {
        delete data[key]
      }
    })

    return data
  }
}
