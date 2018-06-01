'use strict';

module.exports = {
  enabled: false,
  host: process.env.ARK_GRAPHQL_HOST || 'localhost',
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql',
  graphiql: true
}
