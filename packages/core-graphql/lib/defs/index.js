const inputs = require('./inputs')
const types = require('./types')
const root = require('./root')

/**
 * Concatenated strings following the GraphQL syntax to define Types
 * processed by the schema.
 */
module.exports = `
  ${inputs}
  ${root}
  ${types}
`
