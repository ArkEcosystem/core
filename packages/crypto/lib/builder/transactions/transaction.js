const Model = require('../../models/transaction')
const cryptoBuilder = require('../crypto')
const configManager = require('../../managers/config')
const slots = require('../../crypto/slots')

module.exports = class Transaction {
  /**
   * @constructor
   */
  constructor () {
    this.model = Model

    this.id = null
    this.timestamp = slots.getTime()
    this.version = 0x01
    this.network = configManager.get('pubKeyHash')
  }

  /**
   * Create new instance.
   * @return {Transaction}
   */
  create () {
    return this
  }

  /**
   * Set transaction version.
   * @param {Number} version
   * @return {Transaction}
   */
  setVersion (version) {
    this.version = version
    return this
  }

  /**
   * Set transaction fee.
   * @param {Number} fee
   * @return {Transaction}
   */
  setFee (fee) {
    this.fee = fee
    return this
  }

  /**
   * Set amount to transfer.
   * @param  {Number} amount
   * @return {Transaction}
   */
  setAmount (amount) {
    this.amount = amount
    return this
  }

  /**
   * Set recipient id.
   * @param  {String} recipientId
   * @return {Transaction}
   */
  setRecipientId (recipientId) {
    this.recipientId = recipientId
    return this
  }

  /**
   * Set sender public key.
   * @param  {String} publicKey
   * @return {Transaction}
   */
  setSenderPublicKey (publicKey) {
    this.senderPublicKey = publicKey
    return this
  }

  /**
   * Verify the transaction.
   * @return {Boolean}
   */
  verify () {
    return cryptoBuilder.verify(this)
  }

  /**
   * Serialize the transaction.
   * @return {Buffer}
   */
  serialize () {
    return this.model.serialize(this.getStruct())
  }

  /**
   * Sign transaction using passphrase.
   * @param  {String} passphrase
   * @return {Transaction}
   */
  sign (passphrase) {
    const keys = cryptoBuilder.getKeys(passphrase)
    this.senderPublicKey = keys.publicKey
    this.signature = cryptoBuilder.sign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Sign transaction with second passphrase.
   * @param  {String} secondPassphrase
   * @return {Transaction}
   */
  secondSign (secondPassphrase) {
    const keys = cryptoBuilder.getKeys(secondPassphrase)
    this.signSignature = cryptoBuilder.secondSign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Get structure of transaction
   * @return {Object}
   */
  getStruct () {
    return {
      // hex: cryptoBuilder.getBytes(this).toString('hex'), // v2
      id: cryptoBuilder.getId(this).toString('hex'),
      signature: this.signature,
      signSignature: this.signSignature,
      timestamp: this.timestamp,

      type: this.type,
      fee: this.fee,
      senderPublicKey: this.senderPublicKey
    }
  }

  /**
   * Get a valid object used to sign a transaction.
   * @return {Object}
   */
  __getSigningObject () {
    const transaction = { ...this }

    Object.keys(transaction).forEach(key => {
      if (['model', 'network', 'id'].includes(key)) {
        delete transaction[key]
      }
    })

    return transaction
  }
}
