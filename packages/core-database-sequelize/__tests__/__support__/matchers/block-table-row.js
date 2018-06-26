'use strict'

module.exports = (actual, expected) => {
  const allowed = ['id', 'version', 'timestamp', 'previous_block', 'height', 'number_of_transactions', 'total_amount', 'total_fee', 'reward', 'payload_length', 'payload_hash', 'generator_public_key', 'block_signature']
  const notAllowed = ['created_at', 'updated_at']

  return {
    message: () => `Expected ${JSON.stringify(actual)} to be a block table row`,
    pass: allowed.every(key => actual.hasOwnProperty(key)) && notAllowed.every(key => !actual.hasOwnProperty(key))
  }
}
