const Model = require('./model')

module.exports = class Block extends Model {
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

  /**
   * The attribute mappings for the transformer.
   * @return {Object}
   */
  getMappings () {
    return {
      id: 'id',
      version: 'version',
      timestamp: 'timestamp',
      previousBlock: 'previous_block',
      height: 'height',
      numberOfTransactions: 'number_of_transactions',
      totalAmount: 'total_amount',
      totalFee: 'total_fee',
      reward: 'reward',
      payloadLength: 'payload_length',
      payloadHash: 'payload_hash',
      generatorPublicKey: 'generator_public_key',
      blockSignature: 'block_signature'
    }
  }
}
