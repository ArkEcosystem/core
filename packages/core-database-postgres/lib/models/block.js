const { bignumify } = require('@arkecosystem/core-utils')
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
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet () {
    return this.createColumnSet([{
      name: 'id'
    }, {
      name: 'version'
    }, {
      name: 'timestamp'
    }, {
      name: 'previous_block',
      prop: 'previousBlock',
      def: null
    }, {
      name: 'height'
    }, {
      name: 'number_of_transactions',
      prop: 'numberOfTransactions'
    }, {
      name: 'total_amount',
      prop: 'totalAmount',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'total_fee',
      prop: 'totalFee',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'reward',
      init: col => {
        return +bignumify(col.value).toFixed()
      }
    }, {
      name: 'payload_length',
      prop: 'payloadLength'
    }, {
      name: 'payload_hash',
      prop: 'payloadHash'
    }, {
      name: 'generator_public_key',
      prop: 'generatorPublicKey'
    }, {
      name: 'block_signature',
      prop: 'blockSignature'
    }])
  }
}
