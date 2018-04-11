const Model = require('../models/transaction')
const cryptoBuilder = require('./crypto')
const configManager = require('../managers/config')
const slots = require('../crypto/slots')

module.exports = class Transaction {
  /**
   * @constructor
   */
  constructor () {
    this.model = Model

    this.id = null
    this.timestamp = slots.getTime()
    this.version = 0x02
    this.network = configManager.get('pubKeyHash')
  }

  /**
   * [create description]
   * @return {[type]} [description]
   */
  create () {
    return this
  }

  /**
   * [setFee description]
   * @param {[type]} value [description]
   */
  setFee (value) {
    this.fee = value
    return this
  }

  /**
   * [setAmount description]
   * @param {[type]} value [description]
   */
  setAmount (value) {
    this.amount = value
    return this
  }

  /**
   * [setRecipientId description]
   * @param {[type]} value [description]
   */
  setRecipientId (value) {
    this.recipientId = value
    return this
  }

  /**
   * [setSenderPublicKey description]
   * @param {[type]} value [description]
   */
  setSenderPublicKey (value) {
    this.senderPublicKey = value
    return this
  }

  /**
   * [verify description]
   * @return {[type]} [description]
   */
  verify () {
    return cryptoBuilder.verify(this)
  }

  /**
   * [serialise description]
   * @return {[type]} [description]
   */
  serialise () {
    return this.model.serialise(this.getStruct())
  }

  /**
   * [sign description]
   * @param  {String} passphrase [description]
   * @return {[type]}            [description]
   */
  sign (passphrase) {
    const keys = cryptoBuilder.getKeys(passphrase)
    this.senderPublicKey = keys.publicKey
    this.signature = cryptoBuilder.sign(this, keys)
    return this
  }

  /**
   * [secondSign description]
   * @param  {String} secondPassphrase  [description]
   * @return {[type]}             [description]
   */
  secondSign (secondPassphrase) {
    const keys = cryptoBuilder.getKeys(secondPassphrase)
    this.secondSignature = cryptoBuilder.secondSign(this, keys)
    return this
  }

  /**
   * [getStruct description]
   * @return {Object} [description]
   */
  getStruct () {
    return {
      hex: cryptoBuilder.getBytes(this).toString('hex'),
      id: cryptoBuilder.getId(this),
      signature: this.signature,
      secondSignature: this.secondSignature,
      timestamp: this.timestamp,

      type: this.type,
      fee: this.fee,
      senderPublicKey: this.senderPublicKey
    }
  }
}
