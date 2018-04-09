import feeManager from '@/managers/fee'
import Transaction from '@/builder/transaction'
import { TRANSACTION_TYPES } from '@/constants'

export default class Delegate extends Transaction {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.DELEGATE
    this.fee = feeManager.get(TRANSACTION_TYPES.DELEGATE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { delegate: {} }
  }

  /**
   * [create description]
   * Overrides the inherited method to add the necessary parameters
   * @param  {String} username [description]
   * @return {[type]}          [description]
   */
  create (username) {
    this.username = username
    return this
  }

  /**
   * [sign description]
   * Overrides the inherited `sign` method to include the public key of the new
   * delegate
   * @param  {String} passphrase [description]
   * @return {[type]}            [description]
   */
  sign (passphrase) {
    super.sign(passphrase)
    this.asset.delegate.publicKey = this.senderPublicKey
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * type of transaction
   * [getStruct description]
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
