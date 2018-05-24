const Model = require('../../models/transaction')
const { crypto, slots } = require('../../crypto')
const configManager = require('../../managers/config')

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
  setVersion (version) {
    this.version = version
    return this
  }

  /**
   * Set transaction fee.
   * @param {Number} fee
   * @return {TransactionBuilder}
   */
  setFee (fee) {
    this.fee = fee
    return this
  }

  /**
   * Set amount to transfer.
   * @param  {Number} amount
   * @return {TransactionBuilder}
   */
  setAmount (amount) {
    this.amount = amount
    return this
  }

  /**
   * Set recipient id.
   * @param  {String} recipientId
   * @return {TransactionBuilder}
   */
  setRecipientId (recipientId) {
    this.recipientId = recipientId
    return this
  }

  /**
   * Set sender public key.
   * @param  {String} publicKey
   * @return {TransactionBuilder}
   */
  senderPublicKey (publicKey) {
    this.senderPublicKey = publicKey
    return this
  }

  /**
   * Verify the transaction.
   * @return {Boolean}
   */
  verify () {
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
    this.senderPublicKey = keys.publicKey
    this.signature = crypto.sign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Sign transaction with second passphrase.
   * @param  {String} secondPassphrase
   * @return {TransactionBuilder}
   */
  secondSign (secondPassphrase) {
    const keys = crypto.getKeys(secondPassphrase)
    this.signSignature = crypto.secondSign(this.__getSigningObject(), keys)
    return this
  }

  /**
   * Get structure of transaction
   * @return {Object}
   */
  getStruct () {
    return {
      // hex: crypto.getBytes(this).toString('hex'), // v2
      id: crypto.getId(this).toString('hex'),
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
    const transaction = this

    Object.keys(transaction).forEach(key => {
      if (['model', 'network', 'id'].includes(key)) {
        delete transaction[key]
      }
    })

    return transaction
  }
}
