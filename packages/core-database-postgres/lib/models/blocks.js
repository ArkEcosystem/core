module.exports = class Block {
  /**
   * Convert the "camel_case" keys to "snake_case".
   * @return {Object}
   */
  transform (block) {
    block.previous_block = block.previousBlock
    block.number_of_transactions = block.numberOfTransactions
    block.total_amount = block.totalAmount
    block.total_fee = block.totalFee
    block.payload_length = block.payloadLength
    block.payload_hash = block.payloadHash
    block.generator_public_key = block.generatorPublicKey
    block.block_signature = block.blockSignature

    return block
  }

  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'blocks'
  }

  /**
   * The attributes that are mass assignable.
   * @return {Array}
   */
  getColumns () {
    return [
      'id',
      'version',
      'timestamp',
      'previous_block',
      'height',
      'number_of_transactions',
      'total_amount',
      'total_fee',
      'reward',
      'payload_length',
      'payload_hash',
      'generator_public_key',
      'block_signature'
    ]
  }
}
