module.exports = class Transaction {
  /**
   * Convert the "camel_case" keys to "snake_case".
   * @return {Object}
   */
  transform (transaction) {
    transaction.block_id = transaction.blockId
    transaction.sender_public_key = transaction.senderPublicKey
    transaction.recipient_id = transaction.recipientId
    transaction.vendor_field_hex = transaction.vendorFieldHex

    return transaction
  }

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
}
