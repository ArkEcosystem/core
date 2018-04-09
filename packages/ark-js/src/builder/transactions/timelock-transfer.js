import feeManager from '@/managers/fee'
import Transaction from '@/builder/transaction'
import { TRANSACTION_TYPES } from '@/constants'

export default class TimelockTransfer extends Transaction {
  /**
   * @constructor
   * @return {[type]} [description]
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.TIMELOCK_TRANSFER
    this.fee = feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.timelockType = 0x00
    this.timelock = null
  }

  /**
   * [create description]
   * Overrides the inherited method to add the necessary parameters
   * @param  {String} recipientId  [description]
   * @param  {[type]} amount       [description]
   * @param  {[type]} timelock     [description]
   * @param  {[type]} timelockType [description]
   * @return {[type]}              [description]
   */
  create (recipientId, amount, timelock, timelockType) {
    this.recipientId = recipientId
    this.amount = amount
    this.timelock = timelock
    this.timelockType = timelockType
    return this
  }

  /**
   * [setVendorField description]
   * @param {[type]} data [description]
   * @param {[type]} type [description]
   */
  setVendorField (data, type) {
    this.vendorFieldHex = Buffer.from(data, type).toString('hex')
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
    struct.vendorFieldHex = this.vendorFieldHex
    struct.asset = this.asset
    struct.timelock = this.timelock
    struct.timelockType = this.timelockType
    return struct
  }
}
