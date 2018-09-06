const sql = require('sql')

module.exports = class Model {
  /**
   * Create a new model instance.
   * @param {Object} pgp
   */
  constructor (pgp) {
    this.pgp = pgp
  }

  /**
   * Return the model & table definition.
   * @return {Object}
   */
  query () {
    return sql.define({
      name: this.getTable(),
      columns: this.getColumnSet().columns.map(column => column.name)
    })
  }

  /**
   * Convert the "camelCase" keys to "snake_case".
   * @return {Object}
   */
  transform (model) {
    const mappings = Object.entries(this.getMappings())

    let transformed = {}

    for (const [original, mapping] of mappings) {
      transformed[mapping] = model[original]
    }

    return transformed
  }

  /**
   * Convert the "camelCase" keys to "snake_case".
   * @param  {Array} v
   * @return {ColumnSet}
   */
  createColumnSet (columns) {
    return new this.pgp.helpers.ColumnSet(columns, {
      table: {
        table: this.getTable(),
        schema: 'public'
      }
    })
  }
}
