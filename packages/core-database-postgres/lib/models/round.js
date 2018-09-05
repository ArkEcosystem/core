const Model = require('./model')

module.exports = class Round extends Model {
  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'rounds'
  }

  /**
   * The attributes that are mass assignable.
   * @return {Array}
   */
  getColumns () {
    return [
      'public_key',
      'balance',
      'round'
    ]
  }

  /**
   * The attribute mappings for the transformer.
   * @return {Object}
   */
  getMappings () {
    return {
      publicKey: 'public_key',
      balance: 'balance',
      round: 'round',
    }
  }
}
