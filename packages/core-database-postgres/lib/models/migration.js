const Model = require('./model')

module.exports = class Round extends Model {
  /**
   * The table associated with the model.
   * @return {String}
   */
  getTable() {
    return 'migrations'
  }

  /**
   * The read-only structure with query-formatting columns.
   * @return {Object}
   */
  getColumnSet() {
    return this.createColumnSet([
      {
        name: 'name',
      },
    ])
  }
}
