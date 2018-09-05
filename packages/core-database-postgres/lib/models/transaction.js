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
   * The attributes that are mass assignable.
   * @return {Array}
   */
  getColumns () {
    return [
      'id',
      'version',
      'block_id',
      'sequence',
      'timestamp',
      'sender_public_key',
      'recipient_id',
      'type',
      'vendor_field_hex',
      'amount',
      'fee',
      'serialized'
    ]
  }

  /**
   * The attribute mappings for the transformer.
   * @return {Object}
   */
  getMappings () {
    return {
      id: 'id',
      version: 'version',
      blockId: 'block_id',
      sequence: 'sequence',
      timestamp: 'timestamp',
      senderPublicKey: 'sender_public_key',
      recipientId: 'recipient_id',
      type: 'type',
      vendorFieldHex: 'vendor_field_hex',
      amount: 'amount',
      fee: 'fee',
      serialized: 'serialized'
    }
  }
}
