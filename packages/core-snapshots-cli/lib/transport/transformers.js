'use strict'

const {Transaction} = require('@arkecosystem/crypto').models

module.exports = {
  transformData: (context, data) => {
    const transformTransaction = (payload) => {
      let transaction = {}
      try {
        transaction = Transaction.fromBytes(Buffer.from(payload.serialized).toString('hex'))
      } catch (error) {
        console.log(error)
        console.log(payload)
        process.exit(1)
      }

      return {
        id: payload.id,
        block_id: payload.block_id,
        sequence: payload.sequence,
        serialized: payload.serialized,
        version: transaction.version,
        timestamp: transaction.timestamp,
        sender_public_key: transaction.senderPublicKey,
        recipient_id: transaction.recipientId,
        type: transaction.type,
        vendor_field_hex: transaction.vendorFieldHex,
        amount: transaction.amount,
        fee: transaction.fee
      }
    }

    switch (context) {
      case 'transactions':
        return transformTransaction(data)
      default:
        return data
    }
  }
}
