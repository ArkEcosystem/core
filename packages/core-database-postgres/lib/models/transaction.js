const { bignumify } = require('@arkecosystem/core-utils')
const Model = require('./model')

module.exports = class Transaction extends Model {
  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'transactions'
  }

  /**
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet () {
    return this.createColumnSet([{
      name: 'id'
    }, {
      name: 'version'
    }, {
      name: 'block_id',
      prop: 'blockId'
    }, {
      name: 'sequence'
    }, {
      name: 'timestamp'
    }, {
      name: 'sender_public_key',
      prop: 'senderPublicKey'
    }, {
      name: 'recipient_id',
      prop: 'recipientId'
    }, {
      name: 'type'
    }, {
      name: 'vendor_field_hex',
      prop: 'vendorFieldHex'
    }, {
      name: 'amount',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'fee',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'serialized',
      init: col => {
        return Buffer.from(col.value, 'hex')
      }
    }])
  }
}
