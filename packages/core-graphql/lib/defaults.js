/**
 * Default configuration for the @phantomchain/core-graphql plugin
 */
module.exports = {
  enabled: false,
  host: process.env.PHANTOM_GRAPHQL_HOST || '0.0.0.0',
  port: process.env.PHANTOM_GRAPHQL_PORT || 4005,
  path: '/graphql',
}
