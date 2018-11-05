'use strict'

/* Column sets.
 * If you modify the order you must adapt the sql files export orders also
 */
module.exports = {
  blocks: ['id', 'version', 'timestamp', 'previous_block', 'height', 'number_of_transactions', 'total_amount', 'total_fee', 'reward', 'payload_length', 'payload_hash', 'generator_public_key', 'block_signature'],
  transactions: ['id', 'version', 'block_id', 'sequence', 'timestamp', 'sender_public_key', 'recipient_id', 'type', 'vendor_field_hex', 'amount', 'fee', 'serialized']
}
