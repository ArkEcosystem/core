const Model = require('./model')

module.exports = class Pool extends Model {
  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable () {
    return 'pool'
  }

  /**
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet () {
    return this.createColumnSet([{
      name: 'id'
    }, {
      name: 'sender_public_key',
      prop: 'senderPublicKey'
    }, {
      name: 'serialized'
    }])
  }
}
