'use strict';

module.exports = {
  enabled: !process.env.ARK_GRAPHQL_DISABLED,
  host: process.env.ARK_GRAPHQL_HOST || '0.0.0.0',
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql',
  graphiql: true
}
