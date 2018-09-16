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
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet () {
    return this.createColumnSet([{
      name: 'public_key',
      prop: 'publicKey'
    }, {
      name: 'balance',
      init: col => {
        return +col.value.toString()
      }
    }, {
      name: 'round'
    }])
  }
}
