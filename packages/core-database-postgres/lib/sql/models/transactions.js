module.exports = class Transaction {
  transform (transaction) {
    transaction.block_id = transaction.blockId
    transaction.sender_public_key = transaction.senderPublicKey
    transaction.recipient_id = transaction.recipientId
    transaction.vendor_field_hex = transaction.vendorFieldHex

    return transaction
  }

  getTable () {
    return 'transactions'
  }

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
