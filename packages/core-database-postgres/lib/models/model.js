module.exports = class Transaction {
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
}
