module.exports = class Transaction {
  /**
   * Create a new model instance.
   * @param {Object} pgp
   */
  constructor (pgp) {
    this.pgp = pgp
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
